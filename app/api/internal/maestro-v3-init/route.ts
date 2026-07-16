/**
 * POST /api/internal/maestro-v3-init
 * 
 * Initialize Maestro V3 Observer on-demand
 * Called once when admin page loads
 * 
 * Response: { success: boolean, message: string }
 */

import "server-only";
import { initializeMaestroV3Observer, isMaestroV3ObserverReady } from "../../../ai/cadpV2/observerInitializer";

export async function POST(): Promise<Response> {
  try {
    if (isMaestroV3ObserverReady()) {
      return Response.json({
        success: true,
        message: "Observer already initialized",
        ready: true,
      });
    }

    console.log("[API] Initializing Maestro V3 Observer...");
    await initializeMaestroV3Observer();

    return Response.json({
      success: true,
      message: "Observer initialized successfully",
      ready: isMaestroV3ObserverReady(),
    });
  } catch (err) {
    console.error(
      "[API] Initialization failed:",
      err instanceof Error ? err.message : String(err)
    );

    return Response.json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
      ready: isMaestroV3ObserverReady(),
    }, { status: 500 });
  }
}
