import { buildCommunityMarketDossier } from "./contract";
import {
  DedicatedCommunityTelegramPublisher,
  OpenAICommunityContentGenerator,
  OpenAICommunityImageGenerator,
} from "./adapters";
import { communityEditorialControl, communityRepository } from "./repository";
import { CommunityIntelligenceService } from "./service";
import type { StoredAnalysis } from "@/app/ai/cadpV2/analysisStore";
import { COMMUNITY_AUTOMATION_DISABLED_REASON, isCommunityAutomationEnabled } from "./automation";

export async function processStoredAnalysisForCommunity(analysis: StoredAnalysis) {
  if (!isCommunityAutomationEnabled()) {
    return { skipped: true as const, reason: COMMUNITY_AUTOMATION_DISABLED_REASON, analysis_id: analysis.analysis_id };
  }
  if (analysis.status !== "COMPLETED" || !analysis.respuesta_maestra) {
    throw new Error("COMMUNITY_REQUIRES_COMPLETED_ANALYSIS");
  }
  if (await communityRepository.hasAnalysis(analysis.analysis_id)) {
    return { skipped: true as const, reason: "ALREADY_PUBLISHED", analysis_id: analysis.analysis_id };
  }

  const dossier = buildCommunityMarketDossier(analysis.respuesta_maestra, analysis.expediente);
  const service = new CommunityIntelligenceService({
    contentGenerator: new OpenAICommunityContentGenerator(),
    imageGenerator: new OpenAICommunityImageGenerator(),
    telegramPublisher: new DedicatedCommunityTelegramPublisher(),
    analysisFeed: communityRepository,
    evidenceStore: communityRepository,
    editorialControl: communityEditorialControl,
  });
  return { skipped: false as const, ...(await service.publish(dossier)) };
}