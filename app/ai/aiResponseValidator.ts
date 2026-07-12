import type { AIAnalysisRequest, AIAnalysisResponse } from "./types";
import { validateAIResponseSchema } from "./aiResponseSchema";

export interface AIValidationResult {
  valid: boolean;
  errors: string[];
  response: AIAnalysisResponse | null;
}

export function validateAIResponse(raw: unknown, request: AIAnalysisRequest): AIValidationResult {
  const schema = validateAIResponseSchema(raw, request);
  return {
    valid: schema.ok,
    errors: schema.errors,
    response: schema.response,
  };
}
