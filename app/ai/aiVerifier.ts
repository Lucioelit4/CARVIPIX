import type { AIAnalysisRequest, AIAnalysisResponse } from "./types";

export interface AIVerificationResult {
  valid: boolean;
  errors: string[];
  repairedResponse: AIAnalysisResponse | null;
}

export class AIVerifier {
  verify(input: { request: AIAnalysisRequest; response: AIAnalysisResponse | null }): AIVerificationResult {
    if (!input.response) {
      return {
        valid: false,
        errors: ["AI_RESPONSE_EMPTY"],
        repairedResponse: null,
      };
    }

    const errors: string[] = [];
    const expectedDirection = input.request.levels.candidate_direction;

    if (expectedDirection !== "NONE" && input.response.direction !== expectedDirection) {
      errors.push("UNAUTHORIZED_DIRECTION_CHANGE");
    }

    return {
      valid: errors.length === 0,
      errors,
      repairedResponse: errors.length === 0 ? input.response : null,
    };
  }
}