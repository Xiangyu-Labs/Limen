import test from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { entries } from "@/lib/db/schema";
import { createTestDb } from "./helpers/test-db";

test("createEntry returns an error for blank content", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const fixture = createTestDb();

  try {
    const actions = createEntryActions({
      db: fixture.db,
      createId: () => "entry-blank",
      scheduleAI: () => {},
      processAIEntry: async () => {},
      revalidatePath: () => {},
      redirect: () => {
        throw new Error("should not redirect");
      },
    });

    const formData = new FormData();
    formData.set("content", "   ");
    const result = await actions.createEntry(formData);

    assert.deepEqual(result, { error: "Content is required" });
  } finally {
    fixture.cleanup();
  }
});

test("createEntry inserts a pending entry and triggers AI processing", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const fixture = createTestDb();

  let processed: { id: string; content: string } | null = null;
  let scheduled: (() => Promise<void>) | null = null;
  let revalidatedPath = "";
  let redirectedTo = "";

  try {
    const actions = createEntryActions({
      db: fixture.db,
      createId: () => "entry-created",
      scheduleAI: (job) => {
        scheduled = job;
      },
      processAIEntry: async (id, content) => {
        processed = { id, content };
      },
      revalidatePath: (path: string) => {
        revalidatedPath = path;
      },
      redirect: (location: string) => {
        redirectedTo = location;
        throw new Error("redirected");
      },
    });

    const formData = new FormData();
    formData.set("content", "Ship more reliable tests");
    formData.set("createdAt", "2024-01-03T11:45");

    await assert.rejects(() => actions.createEntry(formData), /redirected/);

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-created"),
    });

    assert.equal(row?.aiStatus, "pending");
    assert.equal(row?.createdAt?.toISOString(), "2024-01-03T11:45:00.000Z");
    assert.equal(processed, null);
    assert.equal(typeof scheduled, "function");
    assert.equal(revalidatedPath, "/");
    assert.equal(redirectedTo, "/");

    await scheduled?.();

    assert.deepEqual(processed, {
      id: "entry-created",
      content: "Ship more reliable tests",
    });
  } finally {
    fixture.cleanup();
  }
});

test("deleteEntry removes an existing entry", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const fixture = createTestDb();

  await fixture.db.insert(entries).values({
    id: "entry-delete",
    content: "Delete me",
    aiStatus: "done",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  try {
    const actions = createEntryActions({
      db: fixture.db,
      createId: () => "unused",
      scheduleAI: () => {},
      processAIEntry: async () => {},
      revalidatePath: () => {},
      redirect: () => {
        throw new Error("redirected");
      },
    });

    await assert.rejects(() => actions.deleteEntry("entry-delete"), /redirected/);

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-delete"),
    });

    assert.equal(row, undefined);
  } finally {
    fixture.cleanup();
  }
});

test("updateEntry edits title, summary, tags, content, and created time", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const fixture = createTestDb();

  await fixture.db.insert(entries).values({
    id: "entry-update",
    content: "Old content",
    title: "Old title",
    summary: "Old summary",
    tags: JSON.stringify(["old"]),
    aiStatus: "done",
    createdAt: new Date("2024-01-01T08:00:00Z"),
    updatedAt: new Date("2024-01-01T08:00:00Z"),
  });

  let revalidatedPath = "";
  let redirectedTo = "";

  try {
    const actions = createEntryActions({
      db: fixture.db,
      createId: () => "unused",
      scheduleAI: () => {},
      processAIEntry: async () => {},
      revalidatePath: (path: string) => {
        revalidatedPath = path;
      },
      redirect: (location: string) => {
        redirectedTo = location;
        throw new Error("redirected");
      },
    });

    const formData = new FormData();
    formData.set("title", "New title");
    formData.set("summary", "New summary");
    formData.set("tags", "alpha, beta , gamma");
    formData.set("content", "New content");
    formData.set("createdAt", "2024-01-02T09:30");

    await assert.rejects(() => actions.updateEntry("entry-update", formData), /redirected/);

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-update"),
    });

    assert.equal(row?.title, "New title");
    assert.equal(row?.summary, "New summary");
    assert.equal(row?.content, "New content");
    assert.equal(row?.tags, JSON.stringify(["alpha", "beta", "gamma"]));
    assert.equal(row?.createdAt?.toISOString(), "2024-01-02T09:30:00.000Z");
    assert.equal(revalidatedPath, "/entries/entry-update");
    assert.equal(redirectedTo, "/entries/entry-update");
  } finally {
    fixture.cleanup();
  }
});

test("regenerateEntryMetadata resets status and schedules AI regeneration", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const fixture = createTestDb();

  await fixture.db.insert(entries).values({
    id: "entry-regenerate",
    content: "Need better metadata",
    title: "Old title",
    summary: "Old summary",
    tags: JSON.stringify(["old"]),
    aiStatus: "failed",
    createdAt: new Date("2024-01-01T08:00:00Z"),
    updatedAt: new Date("2024-01-01T08:00:00Z"),
  });

  let scheduled: (() => Promise<void>) | null = null;
  let processed: { id: string; content: string } | null = null;
  let revalidatedPath = "";
  let redirectedTo = "";

  try {
    const actions = createEntryActions({
      db: fixture.db,
      createId: () => "unused",
      scheduleAI: (job) => {
        scheduled = job;
      },
      processAIEntry: async (id, content) => {
        processed = { id, content };
      },
      revalidatePath: (path: string) => {
        revalidatedPath = path;
      },
      redirect: (location: string) => {
        redirectedTo = location;
        throw new Error("redirected");
      },
    });

    await assert.rejects(() => actions.regenerateEntryMetadata("entry-regenerate"), /redirected/);

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-regenerate"),
    });

    assert.equal(row?.aiStatus, "pending");
    assert.equal(typeof scheduled, "function");
    assert.equal(processed, null);
    assert.equal(revalidatedPath, "/entries/entry-regenerate");
    assert.equal(redirectedTo, "/entries/entry-regenerate");

    await scheduled?.();

    assert.deepEqual(processed, {
      id: "entry-regenerate",
      content: "Need better metadata",
    });
  } finally {
    fixture.cleanup();
  }
});

test("bulkRegenerateEntryMetadata schedules serial regeneration in selection order", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const fixture = createTestDb();

  await fixture.db.insert(entries).values([
    {
      id: "entry-a",
      content: "First",
      aiStatus: "failed",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "entry-b",
      content: "Second",
      aiStatus: "failed",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  let scheduled: (() => Promise<void>) | null = null;
  const processed: string[] = [];
  const revalidatedPaths: string[] = [];

  const actions = createEntryActions({
    db: fixture.db,
    createId: () => "unused",
    scheduleAI: (job) => {
      scheduled = job;
    },
    processAIEntry: async (id) => {
      processed.push(id);
    },
    revalidatePath: (path: string) => {
      revalidatedPaths.push(path);
    },
    redirect: () => undefined as never,
  });

  await actions.bulkRegenerateEntryMetadata(["entry-b", "entry-a"]);

  const rows = await fixture.db.query.entries.findMany();
  assert.deepEqual(rows.map((row) => row.aiStatus), ["pending", "pending"]);
  assert.equal(typeof scheduled, "function");
  await scheduled?.();
  assert.deepEqual(processed, ["entry-b", "entry-a"]);
  assert.deepEqual(revalidatedPaths, ["/"]);

  fixture.cleanup();
});

test("bulkDeleteEntries removes all selected entries", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const fixture = createTestDb();

  await fixture.db.insert(entries).values([
    { id: "entry-a", content: "First", aiStatus: "done", createdAt: new Date(), updatedAt: new Date() },
    { id: "entry-b", content: "Second", aiStatus: "done", createdAt: new Date(), updatedAt: new Date() },
  ]);

  const actions = createEntryActions({
    db: fixture.db,
    createId: () => "unused",
    scheduleAI: () => {},
    processAIEntry: async () => {},
    revalidatePath: () => {},
    redirect: () => undefined as never,
  });

  await actions.bulkDeleteEntries(["entry-a", "entry-b"]);
  const rows = await fixture.db.query.entries.findMany();
  assert.equal(rows.length, 0);
  fixture.cleanup();
});
