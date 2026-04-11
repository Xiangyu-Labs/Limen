import test from "node:test";
import assert from "node:assert/strict";

test("middleware redirects unauthenticated locale dashboard requests to locale login", async () => {
  const { evaluateMiddlewareRequest } = await import("@/middleware");

  const result = await evaluateMiddlewareRequest({
    pathname: "/zh/entries/new",
    hasSession: false,
    authHeader: null,
    authPassword: "secret",
    cookieLocale: null,
    acceptLanguage: "zh-CN,zh;q=0.9",
  });

  assert.deepEqual(result, { type: "redirect", location: "/zh/login", setCookieLocale: "zh" });
});

test("middleware redirects authenticated locale login requests to locale dashboard", async () => {
  const { evaluateMiddlewareRequest } = await import("@/middleware");

  const result = await evaluateMiddlewareRequest({
    pathname: "/en/login",
    hasSession: true,
    authHeader: null,
    authPassword: "secret",
    cookieLocale: null,
    acceptLanguage: "en-US,en;q=0.9",
  });

  assert.deepEqual(result, { type: "redirect", location: "/en", setCookieLocale: "en" });
});

test("middleware redirects root to cookie locale", async () => {
  const { evaluateMiddlewareRequest } = await import("@/middleware");

  const result = await evaluateMiddlewareRequest({
    pathname: "/",
    hasSession: true,
    authHeader: null,
    authPassword: "secret",
    cookieLocale: "zh",
    acceptLanguage: "en-US,en;q=0.9",
  });

  assert.deepEqual(result, { type: "redirect", location: "/zh", setCookieLocale: "zh" });
});

test("middleware preserves bare login query params when applying locale prefix", async () => {
  const { normalizeLocaleRedirectTarget } = await import("@/middleware");

  assert.equal(
    normalizeLocaleRedirectTarget("/login?next=%2Fentries%2F1", "en"),
    "/en/login?next=%2Fentries%2F1",
  );
});

test("middleware leaves invalid locale paths for app router notFound", async () => {
  const { evaluateMiddlewareRequest } = await import("@/middleware");

  const result = await evaluateMiddlewareRequest({
    pathname: "/fr/entries/1",
    hasSession: true,
    authHeader: null,
    authPassword: "secret",
    cookieLocale: null,
    acceptLanguage: null,
  });

  assert.deepEqual(result, { type: "next" });
});

test("middleware rejects unauthenticated api requests", async () => {
  const { evaluateMiddlewareRequest } = await import("@/middleware");

  const result = await evaluateMiddlewareRequest({
    pathname: "/api/entries",
    hasSession: false,
    authHeader: null,
    authPassword: "secret",
    cookieLocale: null,
    acceptLanguage: null,
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
    cookieLocale: null,
    acceptLanguage: null,
  });

  assert.deepEqual(result, { type: "next" });
});

test("middleware skip list covers favicon and static assets", async () => {
  const { shouldBypassLocaleMiddleware } = await import("@/middleware");

  assert.equal(shouldBypassLocaleMiddleware("/favicon.ico"), true);
  assert.equal(shouldBypassLocaleMiddleware("/robots.txt"), true);
  assert.equal(shouldBypassLocaleMiddleware("/sitemap.xml"), true);
  assert.equal(shouldBypassLocaleMiddleware("/manifest.webmanifest"), true);
  assert.equal(shouldBypassLocaleMiddleware("/images/logo.png"), true);
  assert.equal(shouldBypassLocaleMiddleware("/_next/static/chunks/app.js"), true);
  assert.equal(shouldBypassLocaleMiddleware("/zh/entries"), false);
});
