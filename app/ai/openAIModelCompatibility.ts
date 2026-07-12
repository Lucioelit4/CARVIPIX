export interface OpenAIModelParameterCompatibility {
  model: string;
  chatCompletions: {
    supportsTemperature: boolean;
  };
  responses: {
    supportsReasoning: boolean;
    supportsMaxOutputTokens: boolean;
    supportsStore: boolean;
  };
}

// Compatibility table for migration safety. Extend as new models are adopted.
const OPENAI_MODEL_COMPATIBILITY_TABLE: OpenAIModelParameterCompatibility[] = [
  {
    model: "gpt-5.6-sol",
    chatCompletions: {
      supportsTemperature: false,
    },
    responses: {
      supportsReasoning: true,
      supportsMaxOutputTokens: true,
      supportsStore: true,
    },
  },
  {
    model: "gpt-5.3-codex",
    chatCompletions: {
      supportsTemperature: true,
    },
    responses: {
      supportsReasoning: true,
      supportsMaxOutputTokens: true,
      supportsStore: true,
    },
  },
  {
    model: "gpt-4o-mini",
    chatCompletions: {
      supportsTemperature: true,
    },
    responses: {
      supportsReasoning: false,
      supportsMaxOutputTokens: true,
      supportsStore: true,
    },
  },
  {
    model: "gpt-4.1-mini",
    chatCompletions: {
      supportsTemperature: true,
    },
    responses: {
      supportsReasoning: false,
      supportsMaxOutputTokens: true,
      supportsStore: true,
    },
  },
];

export function getOpenAIModelCompatibility(model: string): OpenAIModelParameterCompatibility {
  const normalized = model.trim().toLowerCase();
  const exact = OPENAI_MODEL_COMPATIBILITY_TABLE.find((entry) => entry.model.toLowerCase() === normalized);
  if (exact) {
    return exact;
  }

  return {
    model,
    chatCompletions: {
      supportsTemperature: true,
    },
    responses: {
      supportsReasoning: false,
      supportsMaxOutputTokens: true,
      supportsStore: true,
    },
  };
}

export function buildModelAwareChatCompletionBody(input: {
  model: string;
  temperature?: number;
  responseFormat: Record<string, unknown>;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}): Record<string, unknown> {
  const compatibility = getOpenAIModelCompatibility(input.model);

  const body: Record<string, unknown> = {
    model: input.model,
    response_format: input.responseFormat,
    messages: input.messages,
  };

  if (compatibility.chatCompletions.supportsTemperature && input.temperature != null) {
    body.temperature = input.temperature;
  }

  return body;
}

export function buildModelAwareResponsesBody(input: {
  model: string;
  instructions: string;
  input: Array<{ role: "user"; content: Array<Record<string, unknown>> }>;
  text: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
  maxOutputTokens?: number;
  metadata?: Record<string, string>;
  store?: boolean;
}): Record<string, unknown> {
  const compatibility = getOpenAIModelCompatibility(input.model);

  const body: Record<string, unknown> = {
    model: input.model,
    instructions: input.instructions,
    input: input.input,
    text: input.text,
  };

  if (compatibility.responses.supportsReasoning && input.reasoning) {
    body.reasoning = input.reasoning;
  }
  if (compatibility.responses.supportsMaxOutputTokens && input.maxOutputTokens != null) {
    body.max_output_tokens = input.maxOutputTokens;
  }
  if (input.metadata && Object.keys(input.metadata).length > 0) {
    body.metadata = input.metadata;
  }
  if (compatibility.responses.supportsStore && input.store != null) {
    body.store = input.store;
  }

  return body;
}
