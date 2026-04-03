import test from "node:test";
import assert from "node:assert/strict";

test("middleware redirects unauthenticated dashboard requests to login", async () => {
  const { evaluateMiddlewareRequest } = await import("@/middleware");

  const result = await evaluateMiddlewareRequest({
    pathname: "/",
    hasSession: false,
    authHeader: null,
    authPassword: "secret",
  });

  assert.deepEqual(result, { type: "redirect", location: "/login" });
});

test("middleware redirects authenticated login requests to dashboard", async () => {
  const { evaluateMiddlewareRequest } = await import("@/middleware");

  const result = await evaluateMiddlewareRequest({
    pathname: "/login",
    hasSession: true,
    authHeader: null,
    authPassword: "secret",
  });

  assert.deepEqual(result, { type: "redirect", location: "/" });
});

test("middleware rejects unauthenticated api requests", async () => {
  const { evaluateMiddlewareRequest } = await import("@/middleware");

  const result = await evaluateMiddlewareRequest({
    pathname: "/api/entries",
    hasSession: false,
    authHeader: null,
    authPassword: "secret",
  });

  assert.deepEqual(result, { type: "json", status: 401, body: { error: "Unauthorized" } });
});

test("middleware allows authenticated api requests", async () => {
  const { evaluateMiddlewareRequest } = await import("@/middleware");

  const result = await evaluateMiddlewareRequest({
    pathname: "/api/entries",
    hasSession: false,
    authHeader: "Bearer secret",
    authPassword: "secret",
  });

  assert.deepEqual(result, { type: "next" });
});
