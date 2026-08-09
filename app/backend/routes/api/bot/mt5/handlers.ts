/**
 * CARVIPIX EA - API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { randomUUID } from "crypto";

//+------------------------------------------------------------------+
// 1. VALIDATE LICENSE
//+------------------------------------------------------------------+

export async function POST_ValidateLicense(request: NextRequest) {
  try {
    const body = await request.json();
    const { license_id } = body;

    if (!license_id) {
      return NextResponse.json({ success: false, message: "license_id required" }, { status: 400 });
    }

    const result = await backendDatabase.query(
      "SELECT id, status, expires_at FROM bot_mt5_licenses WHERE license_id = $1 LIMIT 1",
      [license_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: "License not found" }, { status: 404 });
    }

    const license = result.rows[0];

    if (license.status !== "ACTIVE") {
      return NextResponse.json({ success: false, message: "License status: " + license.status }, { status: 403 });
    }

    if (new Date(license.expires_at) < new Date()) {
      return NextResponse.json({ success: false, message: "License expired" }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: "License valid", license_id }, { status: 200 });
  } catch (error) {
    console.error("[VALIDATE_LICENSE]", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// 2. HANDSHAKE
//+------------------------------------------------------------------+

export async function POST_Handshake(request: NextRequest) {
  try {
    const body = await request.json();
    const { license_id, installation_id, account_hash, magic_number, broker, server } = body;

    if (!license_id || !installation_id || !account_hash) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const licenseResult = await backendDatabase.query(
      "SELECT id, status FROM bot_mt5_licenses WHERE license_id = $1",
      [license_id]
    );

    if (licenseResult.rows.length === 0 || licenseResult.rows[0].status !== "ACTIVE") {
      return NextResponse.json({ success: false, message: "License invalid" }, { status: 403 });
    }

    const installationResult = await backendDatabase.query(
      "SELECT id FROM bot_mt5_installations WHERE installation_id = $1 AND license_id = $2",
      [installation_id, license_id]
    );

    if (installationResult.rows.length === 0) {
      await backendDatabase.query(
        "INSERT INTO bot_mt5_installations (id, license_id, installation_id, account_hash, broker, server, magic_number, status, first_connection, last_heartbeat, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())",
        [randomUUID(), license_id, installation_id, account_hash, broker || "Unknown", server || "Unknown", magic_number || 0, "CONNECTED"]
      );
    } else {
      await backendDatabase.query(
        "UPDATE bot_mt5_installations SET last_heartbeat = NOW(), status = 'CONNECTED' WHERE installation_id = $1",
        [installation_id]
      );
    }

    return NextResponse.json({ success: true, message: "Handshake successful", status: "CONNECTED" }, { status: 200 });
  } catch (error) {
    console.error("[HANDSHAKE]", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// 3. HEARTBEAT
//+------------------------------------------------------------------+

export async function POST_Heartbeat(request: NextRequest) {
  try {
    const body = await request.json();
    const { installation_id, account_hash, open_positions, daily_trades, daily_loss_percent } = body;

    if (!installation_id || !account_hash) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    await backendDatabase.query(
      "UPDATE bot_mt5_installations SET last_heartbeat = NOW(), status = 'CONNECTED', open_positions = $2, daily_trades = $3, daily_loss_percent = $4 WHERE installation_id = $1",
      [installation_id, open_positions || 0, daily_trades || 0, daily_loss_percent || 0]
    );

    return NextResponse.json({ success: true, message: "Heartbeat received" }, { status: 200 });
  } catch (error) {
    console.error("[HEARTBEAT]", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// 4. GET NEXT SIGNAL
//+------------------------------------------------------------------+

export async function GET_NextSignal(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const installation_id = url.searchParams.get("installation_id");
    const account_hash = url.searchParams.get("account_hash");

    if (!installation_id || !account_hash) {
      return NextResponse.json({ has_signal: false, message: "Missing params" }, { status: 400 });
    }

    const result = await backendDatabase.query(
      "SELECT id, signal_id, symbol, decision, entry, stop_loss, take_profit, risk_reward, expires_at, created_at FROM bot_mt5_signals WHERE status = 'PENDING' AND (installation_id IS NULL OR installation_id = $1) ORDER BY created_at ASC LIMIT 1",
      [installation_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ has_signal: false }, { status: 200 });
    }

    const signal = result.rows[0];

    await backendDatabase.query(
      "UPDATE bot_mt5_signals SET status = 'DELIVERED', delivered_at = NOW() WHERE id = $1",
      [signal.id]
    );

    return NextResponse.json({
      has_signal: true,
      signal_id: signal.signal_id,
      event_id: signal.signal_id,
      symbol: signal.symbol,
      decision: signal.decision,
      entry: parseFloat(signal.entry),
      stop_loss: parseFloat(signal.stop_loss),
      take_profit: parseFloat(signal.take_profit),
      risk_reward: parseFloat(signal.risk_reward),
      created_at: signal.created_at,
      expires_at: signal.expires_at,
    }, { status: 200 });
  } catch (error) {
    console.error("[GET_NEXT_SIGNAL]", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// 5. REPORT EXECUTION
//+------------------------------------------------------------------+

export async function POST_ReportExecution(request: NextRequest) {
  try {
    const body = await request.json();
    const { signal_id, installation_id, ticket, entry_price, lot_size, pnl } = body;

    if (!signal_id || !installation_id) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    await backendDatabase.query(
      "UPDATE bot_mt5_signals SET status = 'EXECUTED', executed_at = NOW() WHERE signal_id = $1",
      [signal_id]
    );

    if (ticket) {
      await backendDatabase.query(
        "INSERT INTO bot_mt5_executions (id, signal_id, installation_id, ticket, entry_price, lot_size, pnl, status, opened_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())",
        [randomUUID(), signal_id, installation_id, ticket, entry_price || 0, lot_size || 0, pnl || 0, "OPEN"]
      );
    }

    return NextResponse.json({ success: true, message: "Execution reported" }, { status: 200 });
  } catch (error) {
    console.error("[REPORT_EXECUTION]", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// 6. REPORT REJECTION
//+------------------------------------------------------------------+

export async function POST_ReportRejection(request: NextRequest) {
  try {
    const body = await request.json();
    const { signal_id, reason } = body;

    if (!signal_id) {
      return NextResponse.json({ success: false, message: "Missing signal_id" }, { status: 400 });
    }

    await backendDatabase.query(
      "UPDATE bot_mt5_signals SET status = 'REJECTED', error_reason = $2 WHERE signal_id = $1",
      [signal_id, reason || "Unknown"]
    );

    return NextResponse.json({ success: true, message: "Rejection reported" }, { status: 200 });
  } catch (error) {
    console.error("[REPORT_REJECTION]", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// 7. DISCONNECT
//+------------------------------------------------------------------+

export async function POST_Disconnect(request: NextRequest) {
  try {
    const body = await request.json();
    const { installation_id } = body;

    if (!installation_id) {
      return NextResponse.json({ success: false, message: "Missing installation_id" }, { status: 400 });
    }

    await backendDatabase.query(
      "UPDATE bot_mt5_installations SET status = 'DISCONNECTED', last_heartbeat = NOW() WHERE installation_id = $1",
      [installation_id]
    );

    return NextResponse.json({ success: true, message: "Disconnect recorded" }, { status: 200 });
  } catch (error) {
    console.error("[DISCONNECT]", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// Route Handlers for Next.js
//+------------------------------------------------------------------+

export async function POST(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.includes("/validate-license")) return POST_ValidateLicense(request);
  if (pathname.includes("/handshake")) return POST_Handshake(request);
  if (pathname.includes("/heartbeat")) return POST_Heartbeat(request);
  if (pathname.includes("/execution")) return POST_ReportExecution(request);
  if (pathname.includes("/reject")) return POST_ReportRejection(request);
  if (pathname.includes("/disconnect")) return POST_Disconnect(request);

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.includes("/signal/next")) return GET_NextSignal(request);

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
