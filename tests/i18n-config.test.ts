import test from "node:test";
import assert from "node:assert/strict";

test("resolveRequestLocale prefers URL locale over cookie and header", async () => {
  const { resolveRequestLocale } = await import("@/lib/i18n/resolve-locale");

  assert.equal(
    resolveRequestLocale({
      pathname: "/en/entries/1",
      cookieLocale: "zh",
      acceptLanguage: "zh-CN,zh;q=0.9,en;q=0.8",
    }),
    "en",
  );
});

test("resolveRequestLocale falls back to cookie for non-locale paths", async () => {
  const { resolveRequestLocale } = await import("@/lib/i18n/resolve-locale");

  assert.equal(
    resolveRequestLocale({
      pathname: "/login",
      cookieLocale: "zh",
      acceptLanguage: "en-US,en;q=0.9",
    }),
    "zh",
  );
});

test("resolveRequestLocale falls back to accept-language then default", async () => {
  const { resolveRequestLocale } = await import("@/lib/i18n/resolve-locale");

  assert.equal(
    resolveRequestLocale({
      pathname: "/entries/new",
      cookieLocale: null,
      acceptLanguage: "zh-CN,zh;q=0.9,en;q=0.8",
    }),
    "zh",
  );

  assert.equal(
    resolveRequestLocale({
      pathname: "/entries/new",
      cookieLocale: null,
      acceptLanguage: "fr-FR,fr;q=0.9",
    }),
    "en",
  );
});

test("switchLocalePath preserves query and hash", async () => {
  const { switchLocalePath } = await import("@/lib/i18n/pathname");

  assert.equal(
    switchLocalePath("/zh/entries/1?q=focus#top", "en"),
    "/en/entries/1?q=focus#top",
  );
});

test("switchLocalePath falls back to locale root for unsupported paths", async () => {
  const { switchLocalePath } = await import("@/lib/i18n/pathname");

  assert.equal(switchLocalePath("/unknown", "zh"), "/zh");
});
