import test from "node:test";
import assert from "node:assert/strict";

test("edit entry form model maps entry fields to editable values", async () => {
  const { buildEditEntryFormModel } = await import("@/app/(dashboard)/entries/[id]/edit/page");
  const model = buildEditEntryFormModel({
    id: "entry-1",
    title: "Title",
    summary: "Summary",
    content: "Body",
    tags: JSON.stringify(["alpha", "beta"]),
    createdAt: new Date("2024-01-02T09:30:00Z"),
  } as never);

  assert.equal(model.id, "entry-1");
  assert.equal(model.content, "Body");
  assert.equal(model.createdAt, "2024-01-02T09:30");
  assert.equal("title" in model, false);
  assert.equal("summary" in model, false);
  assert.equal("tags" in model, false);
});

test("entry editor shell model exposes edit-mode copy", async () => {
  const { buildEntryEditorShellModel } = await import("../src/components/EntryEditorShell.tsx");
  const model = buildEntryEditorShellModel({ mode: "edit", contentLength: 12 });

  assert.equal(model.title, "编辑");
  assert.equal(model.primaryActionLabel, "保存");
  assert.equal(model.metaLabel, "12 字");
  assert.equal("helperText" in model, false);
});
