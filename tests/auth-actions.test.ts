import test from "node:test";
import assert from "node:assert/strict";

test("login stores a session and redirects on success", async () => {
  const { createAuthActions } = await import("@/lib/auth/action-core");

  const cookieWrites: unknown[] = [];
  let redirectedTo = "";

  const actions = createAuthActions({
    authPassword: "secret",
    encrypt: async () => "signed-session",
    cookies: async () => ({
      set: (name: string, value: string, options: unknown) => {
        cookieWrites.push({ name, value, options });
      },
    }),
    redirect: (location: string) => {
      redirectedTo = location;
      throw new Error("redirected");
    },
  });

  const formData = new FormData();
  formData.set("password", "secret");

  await assert.rejects(() => actions.login("zh", formData), /redirected/);

  assert.equal(cookieWrites.length, 1);
  assert.equal(redirectedTo, "/zh");
});

test("login returns an error for invalid password", async () => {
  const { createAuthActions } = await import("@/lib/auth/action-core");

  const actions = createAuthActions({
    authPassword: "secret",
    encrypt: async () => "signed-session",
    cookies: async () => ({
      set: () => {
        throw new Error("should not set cookie");
      },
    }),
    redirect: () => {
      throw new Error("should not redirect");
    },
  });

  const formData = new FormData();
  formData.set("password", "wrong");
  const result = await actions.login("en", formData);

  assert.deepEqual(result, { error: "Invalid password" });
});

test("logout redirects to locale login", async () => {
  const { createAuthActions } = await import("@/lib/auth/action-core");

  let redirectedTo = "";

  const actions = createAuthActions({
    authPassword: "secret",
    encrypt: async () => "signed-session",
    cookies: async () => ({
      set: () => undefined,
    }),
    redirect: (location: string) => {
      redirectedTo = location;
      throw new Error("redirected");
    },
  });

  await assert.rejects(() => actions.logout("zh"), /redirected/);
  assert.equal(redirectedTo, "/zh/login");
});
