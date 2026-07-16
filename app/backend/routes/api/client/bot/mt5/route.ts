/**
 * Client APIs - User-facing endpoints for EA management
 */

import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import fs from "fs";
import path from "path";

// Middleware: Verify user authentication
async function verifyUserSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  // TODO: Implement proper JWT verification
  // For now, assume authenticated
  return token || "demo-user";
}

//+------------------------------------------------------------------+
// GET CLIENT LICENSE
//+------------------------------------------------------------------+

export async function GET_ClientLicense(request: NextRequest) {
  try {
    const userId = await verifyUserSession(request);

    const result = await backendDatabase.query(
      `SELECT license_id, status, expires_at, subscription_tier, created_at, max_installations
       FROM bot_mt5_licenses
       WHERE user_id = $1
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { license: null, message: "No license found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { license: result.rows[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET_CLIENT_LICENSE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// GET CLIENT INSTALLATIONS
//+------------------------------------------------------------------+

export async function GET_ClientInstallations(request: NextRequest) {
  try {
    const userId = await verifyUserSession(request);

    // Get license first
    const licenseResult = await backendDatabase.query(
      `SELECT license_id FROM bot_mt5_licenses WHERE user_id = $1`,
      [userId]
    );

    if (licenseResult.rows.length === 0) {
      return NextResponse.json(
        { installations: [] },
        { status: 200 }
      );
    }

    const license_id = licenseResult.rows[0].license_id;

    // Get installations for this license
    const result = await backendDatabase.query(
      `SELECT installation_id, broker, server, account_number, status, 
              open_positions, daily_trades, last_heartbeat, created_at
       FROM bot_mt5_installations
       WHERE license_id = $1
       ORDER BY last_heartbeat DESC`,
      [license_id]
    );

    return NextResponse.json(
      { installations: result.rows },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET_CLIENT_INSTALLATIONS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// GET CLIENT EXECUTIONS
//+------------------------------------------------------------------+

export async function GET_ClientExecutions(request: NextRequest) {
  try {
    const userId = await verifyUserSession(request);

    // Get license
    const licenseResult = await backendDatabase.query(
      `SELECT license_id FROM bot_mt5_licenses WHERE user_id = $1`,
      [userId]
    );

    if (licenseResult.rows.length === 0) {
      return NextResponse.json(
        { executions: [] },
        { status: 200 }
      );
    }

    const license_id = licenseResult.rows[0].license_id;

    // Get installations for this license
    const installationsResult = await backendDatabase.query(
      `SELECT installation_id FROM bot_mt5_installations WHERE license_id = $1`,
      [license_id]
    );

    const installation_ids = installationsResult.rows.map(r => r.installation_id);

    if (installation_ids.length === 0) {
      return NextResponse.json(
        { executions: [] },
        { status: 200 }
      );
    }

    // Get executions for these installations
    const result = await backendDatabase.query(
      `SELECT signal_id, symbol, direction, entry_price, pnl, status, opened_at
       FROM bot_mt5_executions
       WHERE installation_id = ANY($1)
       ORDER BY opened_at DESC
       LIMIT 100`,
      [installation_ids]
    );

    return NextResponse.json(
      { executions: result.rows },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET_CLIENT_EXECUTIONS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// DOWNLOAD EA EXECUTABLE
//+------------------------------------------------------------------+

export async function GET_DownloadEA(request: NextRequest) {
  try {
    const userId = await verifyUserSession(request);

    // Verify license exists and is active
    const licenseResult = await backendDatabase.query(
      `SELECT status FROM bot_mt5_licenses WHERE user_id = $1`,
      [userId]
    );

    if (licenseResult.rows.length === 0 || licenseResult.rows[0].status !== "ACTIVE") {
      return NextResponse.json(
        { error: "License not active" },
        { status: 403 }
      );
    }

    // Read EA binary from filesystem
    const eaPath = path.join(
      process.cwd(),
      "public/downloads/CARVIPIX_EA_MT5_V1.ex5"
    );

    if (!fs.existsSync(eaPath)) {
      return NextResponse.json(
        { error: "EA file not found" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(eaPath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "attachment; filename=CARVIPIX_EA_MT5_V1.ex5",
      },
    });
  } catch (error) {
    console.error("[GET_DOWNLOAD_EA]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// GET STATS
//+------------------------------------------------------------------+

export async function GET_ClientStats(request: NextRequest) {
  try {
    const userId = await verifyUserSession(request);

    const licenseResult = await backendDatabase.query(
      `SELECT license_id FROM bot_mt5_licenses WHERE user_id = $1`,
      [userId]
    );

    if (licenseResult.rows.length === 0) {
      return NextResponse.json(
        {
          stats: {
            active_installations: 0,
            total_positions: 0,
            total_trades_today: 0,
            total_pnl: 0,
          },
        },
        { status: 200 }
      );
    }

    const license_id = licenseResult.rows[0].license_id;

    // Get installation count
    const installCount = await backendDatabase.query(
      `SELECT COUNT(*) as total FROM bot_mt5_installations 
       WHERE license_id = $1 AND status = 'CONNECTED'`,
      [license_id]
    );

    // Get aggregate stats
    const statsResult = await backendDatabase.query(
      `SELECT 
        SUM(open_positions) as total_positions,
        SUM(daily_trades) as total_trades_today
       FROM bot_mt5_installations
       WHERE license_id = $1`,
      [license_id]
    );

    const pnlResult = await backendDatabase.query(
      `SELECT SUM(pnl) as total_pnl FROM bot_mt5_executions
       WHERE installation_id IN (
         SELECT installation_id FROM bot_mt5_installations WHERE license_id = $1
       )
       AND DATE(created_at) = CURRENT_DATE`,
      [license_id]
    );

    return NextResponse.json(
      {
        stats: {
          active_installations: installCount.rows[0]?.total || 0,
          total_positions: statsResult.rows[0]?.total_positions || 0,
          total_trades_today: statsResult.rows[0]?.total_trades_today || 0,
          total_pnl_today: pnlResult.rows[0]?.total_pnl || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET_CLIENT_STATS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

//+------------------------------------------------------------------+
// Route Handlers
//+------------------------------------------------------------------+

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.includes("/license")) return GET_ClientLicense(request);
  if (pathname.includes("/installations")) return GET_ClientInstallations(request);
  if (pathname.includes("/executions")) return GET_ClientExecutions(request);
  if (pathname.includes("/download-ea")) return GET_DownloadEA(request);
  if (pathname.includes("/stats")) return GET_ClientStats(request);

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
