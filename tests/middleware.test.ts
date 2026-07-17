import test from "node:test";
import assert from "node:assert/strict";

test("middleware redirects unauthenticated dashboard requests to login", async () => {
  const { evaluateProxyRequest: evaluateMiddlewareRequest } = await import("@/proxy");

  const result = await evaluateMiddlewareRequest({
    pathname: "/entries/new",
    hasSession: false,
    authHeader: null,
    authPassword: "secret",
  });

  assert.deepEqual(result, { type: "redirect", location: "/login" });
});

test("middleware redirects authenticated login requests to dashboard", async () => {
  const { evaluateProxyRequest: evaluateMiddlewareRequest } = await import("@/proxy");

  const result = await evaluateMiddlewareRequest({
    pathname: "/login",
    hasSession: true,
    authHeader: null,
    authPassword: "secret",
  });

  assert.deepEqual(result, { type: "redirect", location: "/" });
});

test("middleware allows authenticated dashboard requests", async () => {
  const { evaluateProxyRequest: evaluateMiddlewareRequest } = await import("@/proxy");

  const result = await evaluateMiddlewareRequest({
    pathname: "/",
    hasSession: true,
    authHeader: null,
    authPassword: "secret",
  });

  assert.deepEqual(result, { type: "next" });
});

test("middleware redirects legacy locale paths to Chinese-only root routes", async () => {
  const { evaluateProxyRequest: evaluateMiddlewareRequest } = await import("@/proxy");

  const result = await evaluateMiddlewareRequest({
    pathname: "/zh/entries/1",
    hasSession: true,
    authHeader: null,
    authPassword: "secret",
  });

  assert.deepEqual(result, { type: "redirect", location: "/entries/1" });
});

test("middleware rejects unauthenticated api requests", async () => {
  const { evaluateProxyRequest: evaluateMiddlewareRequest } = await import("@/proxy");

  const result = await evaluateMiddlewareRequest({
    pathname: "/api/entries",
    hasSession: false,
    authHeader: null,
    authPassword: "secret",
  });

  assert.deepEqual(result, { type: "json", status: 401, body: { error: "Unauthorized" } });
});

test("middleware allows authenticated api requests", async () => {
  const { evaluateProxyRequest: evaluateMiddlewareRequest } = await import("@/proxy");

  const result = await evaluateMiddlewareRequest({
    pathname: "/api/entries",
    hasSession: false,
    authHeader: "Bearer secret",
    authPassword: "secret",
  });

  assert.deepEqual(result, { type: "next" });
});

test("middleware rejects api requests when auth is not configured", async () => {
  const { evaluateProxyRequest: evaluateMiddlewareRequest } = await import("@/proxy");
  assert.deepEqual(await evaluateMiddlewareRequest({ pathname: "/api/entries", hasSession: false, authHeader: "Bearer undefined", authPassword: undefined }), { type: "json", status: 401, body: { error: "Unauthorized" } });
});

test("middleware skip list covers favicon and static assets", async () => {
  const { shouldBypassProxy: shouldBypassLocaleMiddleware } = await import("@/proxy");

  assert.equal(shouldBypassLocaleMiddleware("/favicon.ico"), true);
  assert.equal(shouldBypassLocaleMiddleware("/robots.txt"), true);
  assert.equal(shouldBypassLocaleMiddleware("/sitemap.xml"), true);
  assert.equal(shouldBypassLocaleMiddleware("/manifest.webmanifest"), true);
  assert.equal(shouldBypassLocaleMiddleware("/images/logo.png"), true);
  assert.equal(shouldBypassLocaleMiddleware("/_next/static/chunks/app.js"), true);
  assert.equal(shouldBypassLocaleMiddleware("/entries"), false);
});
