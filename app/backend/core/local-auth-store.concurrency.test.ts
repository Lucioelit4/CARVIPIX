import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function withTempCwd<T>(run: () => Promise<T>): Promise<T> {
  const previousCwd = process.cwd();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "carvipix-auth-store-"));
  process.chdir(tempDir);

  try {
    return await run();
  } finally {
    process.chdir(previousCwd);
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      const maybeFsError = error as NodeJS.ErrnoException;
      if (maybeFsError.code !== "EBUSY") {
        throw error;
      }
    }
  }
}

test("seedDemoStore handles concurrent invocations without write collisions", async () => {
  await withTempCwd(async () => {
    const store = await import(`./local-auth-store.ts?seed-${Date.now()}`);

    await Promise.all(Array.from({ length: 25 }, () => store.seedDemoStore()));

    const users = await store.listUsers();
    assert.equal(users.length >= 1, true);

    const founder = users.find((user: { userType: string }) => user.userType === "FOUNDER");
    assert.equal(Boolean(founder), true);
  });
});

test("session writes stay stable under parallel create and revoke", async () => {
  await withTempCwd(async () => {
    const store = await import(`./local-auth-store.ts?session-${Date.now()}`);

    await store.seedDemoStore();
    const users = await store.listUsers();
    const founder = users.find((user: { userType: string }) => user.userType === "FOUNDER");
    assert.ok(founder, "Founder user is required for session test");

    const created = await Promise.all(
      Array.from({ length: 20 }, () => store.createSession(founder.id))
    );

    await Promise.all(created.map((entry) => store.revokeSession(entry.token)));

    const sessions = await store.listSessions(founder.id);
    assert.equal(sessions.length, 0);
  });
});
