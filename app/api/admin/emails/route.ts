/**
 * ADMIN API: Email History & Management
 * Acceso: SUPER_ADMIN only
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";
import { EmailHistoryService } from "@/app/backend/services/email-history.service";

export async function GET(request: NextRequest) {
  if (!isValidAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const action = searchParams.get("action");

    // Get email history
    if (action === "list") {
      const history = await EmailHistoryService.getEmailHistory({
        recipientEmail: searchParams.get("email") || undefined,
        userId: searchParams.get("userId") || undefined,
        emailType: searchParams.get("type") || undefined,
        status: searchParams.get("status") || undefined,
        limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50,
        offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0,
      });

      return NextResponse.json({
        ok: true,
        data: history,
        count: history.length,
      });
    }

    // Get email statistics
    if (action === "stats") {
      const stats = await EmailHistoryService.getEmailStats();
      return NextResponse.json({
        ok: true,
        data: stats,
      });
    }

    // Default: show summary
    const stats = await EmailHistoryService.getEmailStats();
    const recentEmails = await EmailHistoryService.getEmailHistory({ limit: 10 });

    return NextResponse.json({
      ok: true,
      summary: {
        stats,
        recentEmails,
      },
    });
  } catch (error) {
    console.error("[ADMIN-EMAIL-HISTORY]", error);
    return NextResponse.json(
      { error: "Error retrieving email history" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isValidAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      emailHistoryId?: string;
      status?: string;
    };

    // Manually update email status (for testing/correction)
    if (body.action === "update-status" && body.emailHistoryId && body.status) {
      await EmailHistoryService.updateEmailStatus(
        body.emailHistoryId,
        body.status as any,
        { manual_update: true, updated_at: new Date().toISOString() }
      );

      return NextResponse.json({
        ok: true,
        message: "Email status updated",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[ADMIN-EMAIL-HISTORY] POST", error);
    return NextResponse.json(
      { error: "Error updating email" },
      { status: 500 }
    );
  }
}
