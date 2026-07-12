import test from "node:test";
import assert from "node:assert/strict";

import { OpenAIAdapter } from "./openAIAdapter";

test("openai adapter blocks when credentials missing", async () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const adapter = new OpenAIAdapter();

  await assert.rejects(
    async () => {
      await adapter.analyze({} as unknown as Parameters<OpenAIAdapter["analyze"]>[0]);
    },
    (err: unknown) => {
      return err instanceof Error && err.message === "BLOCKED_BY_EXTERNAL_DEPENDENCY: OPENAI_CREDENTIALS";
    }
  );

  if (previous) process.env.OPENAI_API_KEY = previous;
});
