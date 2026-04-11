import test from "node:test";
import assert from "node:assert/strict";

test("createEntry returns an error for blank content", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const fixture = (await import("./helpers/test-db")).createTestDb();

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
    const result = await actions.createEntry("en", formData);

    assert.deepEqual(result, { error: "Content is required" });
  } finally {
    fixture.cleanup();
  }
});

test("createEntry inserts a pending entry and redirects within locale", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const { eq } = await import("drizzle-orm");
  const { entries } = await import("@/lib/db/schema");
  const fixture = (await import("./helpers/test-db")).createTestDb();

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
    formData.set("content", "Ship locale-aware redirects");
    formData.set("createdAt", "2024-01-03T11:45");

    await assert.rejects(() => actions.createEntry("zh", formData), /redirected/);

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-created"),
    });

    assert.equal(row?.aiStatus, "pending");
    assert.equal(revalidatedPath, "/zh");
    assert.equal(redirectedTo, "/zh");
    assert.equal(typeof scheduled, "function");

    await scheduled?.();
    assert.deepEqual(processed, {
      id: "entry-created",
      content: "Ship locale-aware redirects",
    });
  } finally {
    fixture.cleanup();
  }
});

test("updateEntry redirects to locale detail page", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const { eq } = await import("drizzle-orm");
  const { entries } = await import("@/lib/db/schema");
  const fixture = (await import("./helpers/test-db")).createTestDb();

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

  let revalidatedPaths: string[] = [];
  let redirectedTo = "";

  try {
    const actions = createEntryActions({
      db: fixture.db,
      createId: () => "unused",
      scheduleAI: () => {},
      processAIEntry: async () => {},
      revalidatePath: (path: string) => {
        revalidatedPaths.push(path);
      },
      redirect: (location: string) => {
        redirectedTo = location;
        throw new Error("redirected");
      },
    });

    const formData = new FormData();
    formData.set("title", "New title");
    formData.set("summary", "New summary");
    formData.set("tags", "alpha, beta");
    formData.set("content", "New content");
    formData.set("createdAt", "2024-01-02T09:30");

    await assert.rejects(() => actions.updateEntry("zh", "entry-update", formData), /redirected/);

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-update"),
    });

    assert.equal(row?.title, "New title");
    assert.deepEqual(revalidatedPaths, ["/zh", "/zh/entries/entry-update"]);
    assert.equal(redirectedTo, "/zh/entries/entry-update");
  } finally {
    fixture.cleanup();
  }
});

test("deleteEntry removes an existing entry and redirects to locale dashboard", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const { eq } = await import("drizzle-orm");
  const { entries } = await import("@/lib/db/schema");
  const fixture = (await import("./helpers/test-db")).createTestDb();

  await fixture.db.insert(entries).values({
    id: "entry-delete",
    content: "Delete me",
    aiStatus: "done",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  try {
    let redirectedTo = "";
    const actions = createEntryActions({
      db: fixture.db,
      createId: () => "unused",
      scheduleAI: () => {},
      processAIEntry: async () => {},
      revalidatePath: () => {},
      redirect: (location: string) => {
        redirectedTo = location;
        throw new Error("redirected");
      },
    });

    await assert.rejects(() => actions.deleteEntry("zh", "entry-delete"), /redirected/);

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-delete"),
    });

    assert.equal(row, undefined);
    assert.equal(redirectedTo, "/zh");
  } finally {
    fixture.cleanup();
  }
});

test("regenerateEntryMetadata resets status and redirects within locale", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const { eq } = await import("drizzle-orm");
  const { entries } = await import("@/lib/db/schema");
  const fixture = (await import("./helpers/test-db")).createTestDb();

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
  let revalidatedPaths: string[] = [];
  let redirectedTo = "";

  try {
    const actions = createEntryActions({
      db: fixture.db,
      createId: () => "unused",
      scheduleAI: (job) => {
        scheduled = job;
      },
      processAIEntry: async () => {},
      revalidatePath: (path: string) => {
        revalidatedPaths.push(path);
      },
      redirect: (location: string) => {
        redirectedTo = location;
        throw new Error("redirected");
      },
    });

    await assert.rejects(() => actions.regenerateEntryMetadata("en", "entry-regenerate"), /redirected/);

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-regenerate"),
    });

    assert.equal(row?.aiStatus, "pending");
    assert.equal(typeof scheduled, "function");
    assert.deepEqual(revalidatedPaths, ["/en", "/en/entries/entry-regenerate"]);
    assert.equal(redirectedTo, "/en/entries/entry-regenerate");
  } finally {
    fixture.cleanup();
  }
});
