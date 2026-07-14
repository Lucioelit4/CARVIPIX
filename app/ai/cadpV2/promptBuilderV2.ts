import { createHash } from "node:crypto";
import type { CadpAnalysisRequestV2, CadpPromptAssembly } from "./types";
import { AnalyticalCoreRegistry } from "./analyticalCoreRegistry";
import { AnalysisMissionRegistry } from "./analysisMissionRegistry";

export interface BuildPromptV2Input {
  request: CadpAnalysisRequestV2;
  responseSchema: string;
}

export class CadpPromptBuilderV2 {
  private readonly coreRegistry = new AnalyticalCoreRegistry();
  private readonly missionRegistry = new AnalysisMissionRegistry();

  build(input: BuildPromptV2Input): CadpPromptAssembly {
    const core = this.coreRegistry.getOfficialCore();
    const mission = this.missionRegistry.getOfficialMission();

    const sections = [
      {
        title: "1. Núcleo Analítico CARVIPIX V1",
        content: core.content,
      },
      {
        title: "2. Mensaje Operativo del Analista",
        content: mission.content,
      },
      {
        title: "3. Estrategias autorizadas",
        content: JSON.stringify(input.request.authorized_strategies),
      },
      {
        title: "4. Expediente numérico",
        content: JSON.stringify({
          identity: input.request.identity,
          timeframes: input.request.timeframes,
          market_now: input.request.market_now,
          risk_envelope: input.request.risk_envelope,
        }),
      },
        {
          title: "5. Contexto visual (H1 + M30 + M5)",
        content: JSON.stringify(input.request.visual_manifest),
      },
      {
        title: "6. Noticias y contexto económico",
        content: JSON.stringify(input.request.news_bundle),
      },
      {
        title: "7. Sesiones de mercado",
        content: JSON.stringify({
          sessions: input.request.sessions,
        }),
      },
      {
        title: "8. Restricciones objetivas",
        content: JSON.stringify({
          feature_flags: input.request.feature_flags,
          constraints: {
            execution: "DISABLED",
            mode: "SHADOW_ONLY",
            human_review_required: true,
            auto_execution_eligible: false,
          },
        }),
      },
      {
        title: "9. Esquema JSON oficial",
        content: input.responseSchema,
      },
    ] as const;

    const prompt_text = sections.map((s) => `${s.title}\n${s.content}`).join("\n\n");
    const prompt_hash = createHash("sha256").update(prompt_text).digest("hex");
    const staticPrefix = sections.slice(0, 3).concat(sections.slice(8, 9)).map((s) => `${s.title}\n${s.content}`).join("\n\n");
    const prompt_cache_key = createHash("sha256").update(staticPrefix).digest("hex");

    return {
      prompt_text,
      prompt_cache_key,
      core_hash: core.content_hash,
      mission_hash: mission.content_hash,
      prompt_hash,
      cache_eligible: true,
      section_order: sections.map((s) => s.title),
    };
  }
}
