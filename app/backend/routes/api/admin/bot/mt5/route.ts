/**
 * CARVIPIX Admin APIs for EA Management
 */

import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { randomUUID } from "crypto";

//+------------------------------------------------------------------+
// GET LICENSES
//+------------------------------------------------------------------+

export async function GET_Licenses(request: NextRequest) {
  try {
    const result = await backendDatabase.query(
      `SELECT id, license_id, status, subscription_tier, created_at, expires_at, max_installations
       FROM bot_mt5_licenses
       ORDER BY created_at DESC
       LIMIT 1000`
    );

    return NextResponse.json(
      { licenses: result.rows },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET_LICENSES]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// GET INSTALLATIONS
//+------------------------------------------------------------------+

export async function GET_Installations(request: NextRequest) {
  try {
    const result = await backendDatabase.query(
      `SELECT id, license_id, installation_id, broker, server, account_number, status, 
              open_positions, daily_trades, last_heartbeat, created_at
       FROM bot_mt5_installations
       ORDER BY last_heartbeat DESC
       LIMIT 1000`
    );

    return NextResponse.json(
      { installations: result.rows },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET_INSTALLATIONS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// GET SIGNALS
//+------------------------------------------------------------------+

export async function GET_Signals(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "1000");

    let query = `SELECT id, signal_id, symbol, decision, entry, stop_loss, take_profit, status, created_at
                 FROM bot_mt5_signals`;
    const params: Array<string | number | Date> = [];

    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await backendDatabase.query(query, params);

    return NextResponse.json(
      { signals: result.rows },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET_SIGNALS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// CREATE LICENSE
//+------------------------------------------------------------------+

export async function POST_CreateLicense(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription_tier, max_installations, expires_in_days } = body;

    if (!subscription_tier) {
      return NextResponse.json({ error: "subscription_tier required" }, { status: 400 });
    }

    // Generar license_id único
    const license_id = `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calcular fecha de expiración
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + (expires_in_days || 365));

    // Insertar en BD
    const result = await backendDatabase.query(
      `INSERT INTO bot_mt5_licenses (
        id, license_id, status, subscription_tier, created_at, expires_at, max_installations
      ) VALUES ($1, $2, $3, $4, NOW(), $5, $6)
      RETURNING id, license_id, status, subscription_tier, expires_at`,
      [
        randomUUID(),
        license_id,
        "ACTIVE",
        subscription_tier,
        expires_at,
        max_installations || 1,
      ]
    );

    return NextResponse.json(
      { success: true, license: result.rows[0], license_id: license_id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST_CREATE_LICENSE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// SUSPEND LICENSE
//+------------------------------------------------------------------+

export async function POST_SuspendLicense(request: NextRequest) {
  try {
    const license_id = request.nextUrl.searchParams.get("license_id");

    if (!license_id) {
      return NextResponse.json({ error: "license_id required" }, { status: 400 });
    }

    await backendDatabase.query(
      `UPDATE bot_mt5_licenses SET status = 'SUSPENDED' WHERE license_id = $1`,
      [license_id]
    );

    return NextResponse.json(
      { success: true, message: "License suspended" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST_SUSPEND_LICENSE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// REVOKE LICENSE
//+------------------------------------------------------------------+

export async function POST_RevokeLicense(request: NextRequest) {
  try {
    const license_id = request.nextUrl.searchParams.get("license_id");

    if (!license_id) {
      return NextResponse.json({ error: "license_id required" }, { status: 400 });
    }

    await backendDatabase.query(
      `UPDATE bot_mt5_licenses SET status = 'REVOKED' WHERE license_id = $1`,
      [license_id]
    );

    return NextResponse.json(
      { success: true, message: "License revoked" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST_REVOKE_LICENSE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// GET STATS
//+------------------------------------------------------------------+

export async function GET_Stats(request: NextRequest) {
  try {
    const licensesResult = await backendDatabase.query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active
       FROM bot_mt5_licenses`
    );

    const installationsResult = await backendDatabase.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'CONNECTED' THEN 1 ELSE 0 END) as connected
       FROM bot_mt5_installations`
    );

    const signalsResult = await backendDatabase.query(
      `SELECT 
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'EXECUTED' THEN 1 ELSE 0 END) as executed,
        SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
       FROM bot_mt5_signals`
    );

    return NextResponse.json(
      {
        licenses: licensesResult.rows[0],
        installations: installationsResult.rows[0],
        signals: signalsResult.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET_STATS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// Route Handlers
//+------------------------------------------------------------------+

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.includes("/licenses")) return GET_Licenses(request);
  if (pathname.includes("/installations")) return GET_Installations(request);
  if (pathname.includes("/signals")) return GET_Signals(request);
  if (pathname.includes("/stats")) return GET_Stats(request);

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.includes("/licenses/create")) return POST_CreateLicense(request);
  if (pathname.includes("/suspend")) return POST_SuspendLicense(request);
  if (pathname.includes("/revoke")) return POST_RevokeLicense(request);

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
