import test from "node:test";
import assert from "node:assert/strict";

test("createEntry returns an error for blank content", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const fixture = await (await import("./helpers/test-db")).createTestDb();

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

    assert.deepEqual(result, { error: "内容不能为空" });
  } finally {
    await fixture.cleanup();
  }
});

test("entry mutations authorize before touching the database", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const fixture = await (await import("./helpers/test-db")).createTestDb();
  try {
    const actions = createEntryActions({
      db: fixture.db,
      createId: () => "unauthorized",
      scheduleAI: () => {},
      processAIEntry: async () => {},
      revalidatePath: () => {},
      redirect: () => { throw new Error("redirected"); },
      authorize: () => { throw new Error("Unauthorized"); },
    });
    const formData = new FormData();
    formData.set("content", "must not be inserted");
    await assert.rejects(() => actions.createEntry(formData), /Unauthorized/);
    assert.equal((await fixture.db.query.entries.findMany()).length, 0);
  } finally {
    await fixture.cleanup();
  }
});

test("createEntry inserts a pending entry and redirects to dashboard", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const { eq } = await import("drizzle-orm");
  const { entries } = await import("@/lib/db/schema");
  const fixture = await (await import("./helpers/test-db")).createTestDb();

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
    formData.set("createdAt", "2024-01-03");

    await assert.rejects(() => actions.createEntry(formData), /redirected/);

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-created"),
    });

    assert.equal(row?.aiStatus, "pending");
    assert.equal(row?.createdAt?.toISOString(), "2024-01-03T00:00:00.000Z");
    assert.equal(revalidatedPath, "/");
    assert.equal(redirectedTo, "/");
    assert.equal(typeof scheduled, "function");

    const scheduledJob = scheduled as (() => Promise<void>) | null;
    assert.ok(scheduledJob);
    await scheduledJob();
    assert.deepEqual(processed, {
      id: "entry-created",
      content: "Ship locale-aware redirects",
    });
  } finally {
    await fixture.cleanup();
  }
});

test("updateEntry keeps only raw diary fields and schedules AI metadata refresh", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const { eq } = await import("drizzle-orm");
  const { entries } = await import("@/lib/db/schema");
  const fixture = await (await import("./helpers/test-db")).createTestDb();

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

  const revalidatedPaths: string[] = [];
  let redirectedTo = "";
  let scheduled: (() => Promise<void>) | null = null;
  let processed: { id: string; content: string } | null = null;

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
        revalidatedPaths.push(path);
      },
      redirect: (location: string) => {
        redirectedTo = location;
        throw new Error("redirected");
      },
    });

    const formData = new FormData();
    formData.set("title", "New title should be ignored");
    formData.set("summary", "New summary should be ignored");
    formData.set("tags", "alpha, beta should be ignored");
    formData.set("content", "New content");
    formData.set("createdAt", "2024-01-02");

    await assert.rejects(() => actions.updateEntry("entry-update", formData), /redirected/);

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-update"),
    });

    assert.equal(row?.title, null);
    assert.equal(row?.summary, null);
    assert.equal(row?.tags, null);
    assert.equal(row?.content, "New content");
    assert.equal(row?.aiStatus, "pending");
    assert.equal(row?.createdAt?.toISOString(), "2024-01-02T00:00:00.000Z");
    assert.equal(typeof scheduled, "function");
    assert.deepEqual(revalidatedPaths, ["/", "/entries/entry-update"]);
    assert.equal(redirectedTo, "/entries/entry-update");

    const scheduledJob = scheduled as (() => Promise<void>) | null;
    assert.ok(scheduledJob);
    await scheduledJob();
    assert.deepEqual(processed, {
      id: "entry-update",
      content: "New content",
    });
  } finally {
    await fixture.cleanup();
  }
});

test("deleteEntry removes an existing entry and redirects to dashboard", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const { eq } = await import("drizzle-orm");
  const { entries } = await import("@/lib/db/schema");
  const fixture = await (await import("./helpers/test-db")).createTestDb();

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

    await assert.rejects(() => actions.deleteEntry("entry-delete"), /redirected/);

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-delete"),
    });

    assert.equal(row, undefined);
    assert.equal(redirectedTo, "/");
  } finally {
    await fixture.cleanup();
  }
});

test("regenerateEntryMetadata resets status and redirects to detail", async () => {
  const { createEntryActions } = await import("@/lib/actions/entries-core");
  const { eq } = await import("drizzle-orm");
  const { entries } = await import("@/lib/db/schema");
  const fixture = await (await import("./helpers/test-db")).createTestDb();

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
  const revalidatedPaths: string[] = [];
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

    await assert.rejects(() => actions.regenerateEntryMetadata("entry-regenerate"), /redirected/);

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-regenerate"),
    });

    assert.equal(row?.aiStatus, "pending");
    assert.equal(typeof scheduled, "function");
    assert.deepEqual(revalidatedPaths, ["/", "/entries/entry-regenerate"]);
    assert.equal(redirectedTo, "/entries/entry-regenerate");
  } finally {
    await fixture.cleanup();
  }
});
