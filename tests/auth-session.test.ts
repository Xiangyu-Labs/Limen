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

test("session manager treats invalid cookies as unauthenticated", async () => {
  const { createSessionManager } = await import("@/lib/auth/session");
  const manager = createSessionManager("test-secret");
  assert.equal(await manager.getSession({ get: () => ({ value: "invalid" }) }), null);
});

test("session cookies use explicit security attributes", async () => {
  const { sessionCookieOptions } = await import("@/lib/auth/session");
  const expires = new Date("2024-02-01T00:00:00.000Z");
  const options = sessionCookieOptions(expires);
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(options.expires, expires);
});
