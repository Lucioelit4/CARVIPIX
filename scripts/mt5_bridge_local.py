import os
import re
import glob
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Query
import MetaTrader5 as mt5

APP_HOST = "127.0.0.1"
APP_PORT = int(os.getenv("MT5_BRIDGE_PORT", "18080"))

TIMEFRAME_MAP = {
    "M5": mt5.TIMEFRAME_M5,
    "H1": mt5.TIMEFRAME_H1,
}

app = FastAPI(title="CARVIPIX MT5 Local Bridge", version="1.0.0")

_state: Dict[str, Any] = {
    "initialized": False,
    "terminal_path": None,
    "account_login": None,
    "server": None,
    "symbol_resolved": None,
}


def mask_login(login: Optional[int]) -> Optional[str]:
    if login is None:
        return None
    s = str(login)
    if len(s) <= 2:
        return "*" * len(s)
    return f"{s[:2]}***{s[-2:]}"


def to_iso(ts: int) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


def find_terminal_candidates() -> List[str]:
    candidates = []
    roots = [
        os.environ.get("ProgramFiles", ""),
        os.environ.get("ProgramFiles(x86)", ""),
        os.environ.get("APPDATA", ""),
        os.environ.get("LOCALAPPDATA", ""),
    ]
    for root in roots:
        if not root:
            continue
        pattern = os.path.join(root, "**", "terminal64.exe")
        for p in glob.glob(pattern, recursive=True):
            candidates.append(p)
    unique = sorted(set(candidates))
    return unique


def pick_oanda_terminal(candidates: List[str]) -> Optional[str]:
    for p in candidates:
        if re.search(r"oanda", p, re.IGNORECASE):
            return p
    return candidates[0] if candidates else None


def ensure_initialized() -> None:
    if _state["initialized"]:
        return

    terminal_candidates = find_terminal_candidates()
    terminal_path = pick_oanda_terminal(terminal_candidates)
    if not terminal_path:
        raise RuntimeError("BLOCKED_BY_EXTERNAL_DEPENDENCY: MT5_TERMINAL_NOT_FOUND")

    ok = mt5.initialize(path=terminal_path)
    if not ok:
        err = mt5.last_error()
        raise RuntimeError(f"BLOCKED_BY_EXTERNAL_DEPENDENCY: MT5_INIT_FAILED:{err}")

    account = mt5.account_info()
    terminal = mt5.terminal_info()
    if account is None or terminal is None:
        raise RuntimeError("BLOCKED_BY_EXTERNAL_DEPENDENCY: MT5_TERMINAL_NOT_CONNECTED")

    _state["initialized"] = True
    _state["terminal_path"] = terminal_path
    _state["account_login"] = int(account.login)
    _state["server"] = str(account.server)


def list_symbols() -> List[str]:
    ensure_initialized()
    symbols = mt5.symbols_get()
    if symbols is None:
        return []
    return sorted({s.name for s in symbols})


def resolve_gold_symbol(requested: str) -> str:
    ensure_initialized()
    requested_u = requested.upper()

    all_symbols = mt5.symbols_get()
    if all_symbols is None:
        raise RuntimeError("BLOCKED_BY_EXTERNAL_DEPENDENCY: MT5_SYMBOLS_UNAVAILABLE")

    # Prefer explicit requested exact and visible-tradeable.
    for s in all_symbols:
        if s.name.upper() == requested_u and s.trade_mode != mt5.SYMBOL_TRADE_MODE_DISABLED:
            _state["symbol_resolved"] = s.name
            return s.name

    candidates = []
    for s in all_symbols:
        name_u = s.name.upper()
        if "XAU" in name_u or "GOLD" in name_u:
            if "XAG" in name_u:
                continue
            # Must look like gold vs USD.
            if "USD" not in name_u:
                continue
            if s.trade_mode == mt5.SYMBOL_TRADE_MODE_DISABLED:
                continue
            candidates.append(s)

    if not candidates:
        raise RuntimeError("BLOCKED_BY_EXTERNAL_DEPENDENCY: XAUUSD_SYMBOL_NOT_FOUND")

    # Ranking: explicit XAU+USD first, then GOLD+USD.
    def score(sym) -> int:
        n = sym.name.upper()
        if "XAU" in n and "USD" in n:
            return 0
        if "GOLD" in n and "USD" in n:
            return 1
        return 2

    candidates.sort(key=score)
    chosen = candidates[0]
    _state["symbol_resolved"] = chosen.name
    return chosen.name


def get_tick(symbol: str) -> Dict[str, Any]:
    ensure_initialized()
    if not mt5.symbol_select(symbol, True):
        raise RuntimeError(f"BLOCKED_BY_EXTERNAL_DEPENDENCY: SYMBOL_SELECT_FAILED:{symbol}")

    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        raise RuntimeError(f"BLOCKED_BY_EXTERNAL_DEPENDENCY: TICK_UNAVAILABLE:{symbol}")

    return {
        "symbol": symbol,
        "bid": float(tick.bid),
        "ask": float(tick.ask),
        "time": int(tick.time),
        "time_iso": to_iso(int(tick.time)),
    }


def get_candles(symbol: str, timeframe: str, count: int) -> Dict[str, Any]:
    ensure_initialized()
    tf = TIMEFRAME_MAP.get(timeframe.upper())
    if tf is None:
        raise RuntimeError(f"INVALID_TIMEFRAME:{timeframe}")

    if not mt5.symbol_select(symbol, True):
        raise RuntimeError(f"BLOCKED_BY_EXTERNAL_DEPENDENCY: SYMBOL_SELECT_FAILED:{symbol}")

    bars = mt5.copy_rates_from_pos(symbol, tf, 0, max(1, int(count)))
    if bars is None:
        raise RuntimeError(f"BLOCKED_BY_EXTERNAL_DEPENDENCY: CANDLES_UNAVAILABLE:{symbol}:{timeframe}")

    out = []
    for b in bars:
        out.append(
            {
                "time": int(b["time"]),
                "time_iso": to_iso(int(b["time"])),
                "open": float(b["open"]),
                "high": float(b["high"]),
                "low": float(b["low"]),
                "close": float(b["close"]),
                "tick_volume": int(b["tick_volume"]),
                "real_volume": int(b["real_volume"]),
                "spread": int(b["spread"]),
                "complete": True,
            }
        )

    return {
        "symbol": symbol,
        "timeframe": timeframe.upper(),
        "count": len(out),
        "candles": out,
    }


@app.get("/health")
def health() -> Dict[str, Any]:
    try:
        ensure_initialized()
        account = mt5.account_info()
        terminal = mt5.terminal_info()
        return {
            "bridge_status": "ok",
            "terminal_connected": bool(account is not None and terminal is not None),
            "terminal_path": _state["terminal_path"],
            "account_login_masked": mask_login(_state["account_login"]),
            "server": _state["server"],
            "symbol_resolved": _state.get("symbol_resolved"),
        }
    except Exception as exc:
        return {
            "bridge_status": "error",
            "terminal_connected": False,
            "error": str(exc),
        }


@app.get("/symbols")
def symbols() -> Dict[str, Any]:
    try:
        items = list_symbols()
        return {"count": len(items), "symbols": items}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.get("/symbols/resolve")
def symbols_resolve(requested: str = Query(..., min_length=1)) -> Dict[str, Any]:
    try:
        resolved = resolve_gold_symbol(requested)
        return {"requested": requested, "resolved": resolved}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.get("/tick")
def tick(symbol: str = Query(..., min_length=1)) -> Dict[str, Any]:
    try:
        return get_tick(symbol)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.get("/candles")
def candles(
    symbol: str = Query(..., min_length=1),
    timeframe: str = Query(..., min_length=2),
    count: int = Query(100, ge=1, le=5000),
) -> Dict[str, Any]:
    try:
        return get_candles(symbol, timeframe, count)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=APP_HOST, port=APP_PORT)
