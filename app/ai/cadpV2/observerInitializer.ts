/**
 * Server-side initialization for Maestro V3 Observer
 * This runs once when the Next.js server starts
 */

import { MarketDataPipeline } from "../../engine/data/marketDataPipeline";
import { IndicatorFramework } from "../../engine/data/indicatorFramework";
import { startObserverRunner } from "../cadpV2/observerRunner";

let initialized = false;

/**
 * Initialize the Maestro V3 observer system
 * Called once from app/layout.tsx or similar
 */
export async function initializeMaestroV3Observer(): Promise<void> {
  if (initialized) {
    console.log("[MaestroV3Init] Already initialized");
    return;
  }

  try {
    console.log("[MaestroV3Init] Initializing Maestro V3 Observer with REAL DATA...");

    // Create pipeline and indicators
    const pipeline = new MarketDataPipeline();
    const indicators = new IndicatorFramework();

    console.log("[MaestroV3Init] ✅ Created pipeline and indicators");

    // Start observer runner (this will:
    // 1. Load real data from Twelve Data
    // 2. Initialize scheduler
    // 3. Start background monitoring)
    startObserverRunner({ pipeline, indicators });

    initialized = true;
    console.log("[MaestroV3Init] ✅ Observer runner started with real data");
  } catch (err) {
    console.error(
      "[MaestroV3Init] Failed to initialize:",
      err instanceof Error ? err.message : String(err)
    );
    // Don't throw - let app continue even if observer fails
  }
}

/**
 * Check if observer is ready
 */
export function isMaestroV3ObserverReady(): boolean {
  return initialized;
}
