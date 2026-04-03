import test from "node:test";
import assert from "node:assert/strict";

test("session manager encrypts and decrypts payloads", async () => {
  const { createSessionManager } = await import("@/lib/auth/session");
  const manager = createSessionManager("test-secret");

  const token = await manager.encrypt({ user: "demo" });
  const payload = await manager.decrypt(token);

  assert.equal(payload.user, "demo");
});

test("session manager returns null when cookie store has no session", async () => {
  const { createSessionManager } = await import("@/lib/auth/session");
  const manager = createSessionManager("test-secret");

  const session = await manager.getSession({
    get: () => undefined,
  });

  assert.equal(session, null);
});
