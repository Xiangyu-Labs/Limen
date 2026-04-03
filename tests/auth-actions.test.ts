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

  await assert.rejects(
    () => actions.login(formData),
    /redirected/,
  );

  assert.equal(cookieWrites.length, 1);
  assert.equal(redirectedTo, "/");
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
  const result = await actions.login(formData);

  assert.deepEqual(result, { error: "Invalid password" });
});
