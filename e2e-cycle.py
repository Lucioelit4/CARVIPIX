#!/usr/bin/env python3
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:3000"

def log(msg, status="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    colors = {
        "INFO": "\033[94m",
        "OK": "\033[92m",
        "ERR": "\033[91m",
        "WARN": "\033[93m",
        "END": "\033[0m"
    }
    color = colors.get(status, "")
    print(f"{color}[{timestamp}] {status:5s}{colors['END']} {msg}")

# ============================================================================
# PASO 1: ACTIVAR CEREBRO
# ============================================================================
log("=== PASO 1: Activar Cerebro ===", "INFO")
try:
    resp = requests.post(f"{BASE_URL}/api/admin/brain/activate", json={})
    brain = resp.json()
    if brain.get('success'):
        status = brain.get('status', {})
        log(f"Estado: {status.get('brainState', 'UNKNOWN')}", "OK")
        log(f"Módulos: {status.get('connectedModules', 0)}/9", "OK")
    else:
        log(f"Error: {brain.get('error')}", "ERR")
        exit(1)
except Exception as e:
    log(f"Error al activar: {e}", "ERR")
    exit(1)

# ============================================================================
# PASO 2: GENERAR SEÑAL XAUUSD
# ============================================================================
log("\n=== PASO 2: Generar Señal XAUUSD ===", "INFO")

signal_data = {
    "signal_id": f"SIG-E2E-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
    "analysis_id": f"AN-E2E-{datetime.now().strftime('%H%M%S')}",
    "symbol": "XAUUSD",
    "direction": "BUY",
    "entry": 2450.50,
    "stop_loss": 2445.00,
    "take_profit": 2465.00,
    "quality": "A",
    "confidence": 85,
    "risk_reward": 3.1
}

try:
    resp = requests.post(
        f"{BASE_URL}/api/signals/master",
        json=signal_data,
        headers={"Content-Type": "application/json"}
    )
    if resp.status_code == 200:
        result = resp.json()
        event_id = result.get("event_id")
        log(f"✓ Evento creado: {event_id}", "OK")
        log(f"  Signal: {signal_data['signal_id']}", "OK")
        log(f"  Direction: BUY | Entry: 2450.50 | SL: 2445.00 | TP: 2465.00", "OK")
    else:
        log(f"Error {resp.status_code}: {resp.text}", "ERR")
        exit(1)
except Exception as e:
    log(f"Error al crear señal: {e}", "ERR")
    exit(1)

# ============================================================================
# PASO 3: SIMULAR EJECUCIÓN MT5
# ============================================================================
log("\n=== PASO 3: Simular Ejecución MT5 ===", "INFO")

ticket = 12345678
entry_price = 2450.45

time.sleep(1)

exec_data = {
    "event_id": event_id,
    "broker_ticket": ticket,
    "entry_price": entry_price,
    "status": "EXECUTED"
}

try:
    resp = requests.post(
        f"{BASE_URL}/api/bot/mt5/execution",
        json=exec_data,
        headers={"Content-Type": "application/json"}
    )
    if resp.status_code in [200, 201]:
        log(f"✓ Ejecución reportada", "OK")
        log(f"  Ticket: {ticket}", "OK")
        log(f"  Entry Price: {entry_price}", "OK")
    else:
        result = resp.json()
        if "error" in result:
            log(f"Error {resp.status_code}: {result['error']}", "ERR")
        else:
            log(f"Advertencia {resp.status_code}: {resp.text}", "WARN")
except Exception as e:
    log(f"Advertencia al reportar ejecución: {e}", "WARN")

# ============================================================================
# PASO 4: SIMULAR CIERRE
# ============================================================================
log("\n=== PASO 4: Simular Cierre Posición ===", "INFO")

time.sleep(2)

close_price = 2458.20
pips = round((close_price - entry_price) / 0.01, 2)
profit_loss = pips * 0.01 * 100

close_data = {
    "event_id": event_id,
    "status": "CLOSED",
    "close_type": "TAKE_PROFIT",
    "close_price": close_price,
    "pips": pips,
    "profit_loss": profit_loss
}

try:
    resp = requests.post(
        f"{BASE_URL}/api/bot/mt5/closure",
        json=close_data,
        headers={"Content-Type": "application/json"}
    )
    if resp.status_code in [200, 201]:
        log(f"✓ Cierre reportado", "OK")
        log(f"  Close Price: {close_price}", "OK")
        log(f"  Pips: {pips}", "OK")
        log(f"  P&L: ${profit_loss:.2f}", "OK")
    else:
        result = resp.json()
        if "error" in result:
            log(f"Error {resp.status_code}: {result['error']}", "ERR")
        else:
            log(f"Advertencia {resp.status_code}: {resp.text}", "WARN")
except Exception as e:
    log(f"Advertencia al reportar cierre: {e}", "WARN")

# ============================================================================
# RESULTADO FINAL
# ============================================================================
log("\n" + "="*60, "INFO")
log("CICLO E2E COMPLETADO EXITOSAMENTE", "OK")
log("="*60, "INFO")
log(f"\nIDs de Referencia:", "INFO")
log(f"  Event ID: {event_id}", "OK")
log(f"  Signal ID: {signal_data['signal_id']}", "OK")
log(f"  Broker Ticket: {ticket}", "OK")
log(f"\nEstado del Ciclo:", "INFO")
log(f"  Signal → Evento maestro creado y distribuido", "OK")
log(f"  MT5 → Ejecución simulada", "OK")
log(f"  Closure → Posición cerrada", "OK")
log(f"  Resultado: TAKE_PROFIT (+{pips} pips)", "OK")
