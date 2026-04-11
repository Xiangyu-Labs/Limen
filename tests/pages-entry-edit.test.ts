import test from "node:test";
import assert from "node:assert/strict";

test("edit entry form model maps entry fields to editable values", async () => {
  const { buildEditEntryFormModel } = await import("../src/app/[locale]/(dashboard)/entries/[id]/edit/page");
  const model = buildEditEntryFormModel({
    id: "entry-1",
    title: "Title",
    summary: "Summary",
    content: "Body",
    tags: JSON.stringify(["alpha", "beta"]),
    createdAt: new Date("2024-01-02T09:30:00Z"),
  } as never);

  assert.equal(model.id, "entry-1");
  assert.equal(model.title, "Title");
  assert.equal(model.summary, "Summary");
  assert.equal(model.content, "Body");
  assert.equal(model.tags, "alpha, beta");
  assert.equal(model.createdAt, "2024-01-02T09:30");
});

test("entry editor shell model exposes edit-mode copy", async () => {
  const { buildEntryEditorShellModel } = await import("../src/components/EntryEditorShell.tsx");
  const model = buildEntryEditorShellModel({ mode: "edit", contentLength: 12 });

  assert.equal(model.title, "Edit Entry");
  assert.equal(model.primaryActionLabel, "Save");
  assert.equal(model.helperText, "Refine the structured fields or rewrite the original capture.");
});
