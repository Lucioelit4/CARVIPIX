import assert from "node:assert/strict";
import test from "node:test";

import { getOpenAIRuntimeConfig } from "./openAIConfig";

test("openai runtime config blocks when api key is missing", () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  assert.throws(() => getOpenAIRuntimeConfig(), /BLOCKED_BY_EXTERNAL_DEPENDENCY: OPENAI_CREDENTIALS/);

  if (previous != null) process.env.OPENAI_API_KEY = previous;
});

test("openai runtime config blocks when model is missing", () => {
  const prevKey = process.env.OPENAI_API_KEY;
  const prevModel = process.env.OPENAI_MODEL;
  process.env.OPENAI_API_KEY = "dummy";
  delete process.env.OPENAI_MODEL;

  assert.throws(() => getOpenAIRuntimeConfig(), /BLOCKED_BY_EXTERNAL_DEPENDENCY: OPENAI_MODEL/);

  if (prevKey != null) process.env.OPENAI_API_KEY = prevKey;
  else delete process.env.OPENAI_API_KEY;
  if (prevModel != null) process.env.OPENAI_MODEL = prevModel;
  else delete process.env.OPENAI_MODEL;
});

test("openai runtime config reads production env knobs", () => {
  const prev = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENAI_TIMEOUT_MS: process.env.OPENAI_TIMEOUT_MS,
    OPENAI_MAX_RETRIES: process.env.OPENAI_MAX_RETRIES,
    OPENAI_RETRY_BASE_MS: process.env.OPENAI_RETRY_BASE_MS,
    OPENAI_ORGANIZATION: process.env.OPENAI_ORGANIZATION,
    OPENAI_PROJECT: process.env.OPENAI_PROJECT,
  };

  process.env.OPENAI_API_KEY = "dummy";
  process.env.OPENAI_MODEL = "gpt-5.3-codex";
  process.env.OPENAI_BASE_URL = "https://api.openai.com/v1/";
  process.env.OPENAI_TIMEOUT_MS = "45000";
  process.env.OPENAI_MAX_RETRIES = "3";
  process.env.OPENAI_RETRY_BASE_MS = "900";
  process.env.OPENAI_ORGANIZATION = "org_test";
  process.env.OPENAI_PROJECT = "proj_test";

  const config = getOpenAIRuntimeConfig();
  assert.equal(config.model, "gpt-5.3-codex");
  assert.equal(config.baseUrl, "https://api.openai.com/v1");
  assert.equal(config.timeoutMs, 45000);
  assert.equal(config.maxRetries, 3);
  assert.equal(config.retryBaseMs, 900);
  assert.equal(config.organization, "org_test");
  assert.equal(config.project, "proj_test");

  for (const [key, value] of Object.entries(prev)) {
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
});
