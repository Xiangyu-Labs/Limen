import test from "node:test";
import assert from "node:assert/strict";

test("new entry submit is disabled when loading", async () => {
  const { isEntrySubmitDisabled } = await import("@/app/(dashboard)/entries/new/page");
  assert.equal(isEntrySubmitDisabled({ loading: true, content: "hello" }), true);
});

test("new entry submit is disabled for blank content and enabled for real content", async () => {
  const { isEntrySubmitDisabled } = await import("@/app/(dashboard)/entries/new/page");
  assert.equal(isEntrySubmitDisabled({ loading: false, content: "   " }), true);
  assert.equal(isEntrySubmitDisabled({ loading: false, content: "hello" }), false);
});

test("entry editor shell model exposes create-mode copy", async () => {
  const { buildEntryEditorShellModel } = await import("../src/components/EntryEditorShell.tsx");
  const model = buildEntryEditorShellModel({ mode: "create", contentLength: 42 });

  assert.equal(model.title, "New Capture");
  assert.equal(model.primaryActionLabel, "Capture");
  assert.equal(model.metaLabel, "42 characters");
});

test("new entry page derives a datetime-local default timestamp", async () => {
  const { getDefaultCreatedAtValue } = await import("@/app/(dashboard)/entries/new/page");
  assert.equal(
    getDefaultCreatedAtValue(new Date("2024-01-03T11:45:00.000Z")),
    "2024-01-03T11:45",
  );
});
