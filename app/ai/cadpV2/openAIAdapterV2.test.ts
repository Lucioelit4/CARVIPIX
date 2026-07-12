import assert from "node:assert/strict";
import test from "node:test";

import { OpenAIAdapterV2 } from "./openAIAdapterV2";

test("openai adapter v2 blocks when credentials are missing", async () => {
  const prevKey = process.env.OPENAI_API_KEY;
  const prevModel = process.env.OPENAI_MODEL;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MODEL;

  const adapter = new OpenAIAdapterV2();
  await assert.rejects(
    () => adapter.analyze({
      promptText: "{}",
      responseSchemaName: "schema",
      responseSchema: { type: "object", additionalProperties: false, properties: {} },
    }),
    /BLOCKED_BY_EXTERNAL_DEPENDENCY/
  );

  if (prevKey != null) process.env.OPENAI_API_KEY = prevKey;
  else delete process.env.OPENAI_API_KEY;
  if (prevModel != null) process.env.OPENAI_MODEL = prevModel;
  else delete process.env.OPENAI_MODEL;
});
