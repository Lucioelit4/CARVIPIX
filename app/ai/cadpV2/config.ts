import type { CadpFeatureFlags } from "./types";

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

function envString(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

export function getCadpFeatureFlags(): CadpFeatureFlags {
  return {
    CADP_V1_ENABLED: envBool("CADP_V1_ENABLED", false),
    AI_ANALYST_MODE: (envString("AI_ANALYST_MODE", "SHADOW") as CadpFeatureFlags["AI_ANALYST_MODE"]),
    // DEFAULT: false for PAPER/SHADOW mode. Enable with AI_VISUAL_CONTEXT_ENABLED=true.
    AI_VISUAL_CONTEXT_REQUIRED: envBool("AI_VISUAL_CONTEXT_ENABLED", false),
    AI_NEWS_RESEARCH_ENABLED: envBool("AI_NEWS_RESEARCH_ENABLED", false),
    AI_REASONING_EFFORT: envString("AI_REASONING_EFFORT", ""),
    AI_IMAGE_DETAIL: envString("AI_IMAGE_DETAIL", ""),
  };
}

export interface CadpV3OptimizationFlags {
  SMART_CHANGE_DETECTOR_ENABLED: boolean;
  ANALYSIS_TEMPORAL_MEMORY_ENABLED: boolean;
  SMART_EXPEDIENT_ENABLED: boolean;
}

export function getCadpV3OptimizationFlags(): CadpV3OptimizationFlags {
  return {
    SMART_CHANGE_DETECTOR_ENABLED: envBool("SMART_CHANGE_DETECTOR_ENABLED", false),
    ANALYSIS_TEMPORAL_MEMORY_ENABLED: envBool("ANALYSIS_TEMPORAL_MEMORY_ENABLED", false),
    SMART_EXPEDIENT_ENABLED: envBool("SMART_EXPEDIENT_ENABLED", false),
  };
}
