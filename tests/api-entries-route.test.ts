import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/test-db";
import { seedEntry } from "./helpers/test-entries";

test("POST rejects requests without string content", async () => {
  const fixture = createTestDb();
  try {
    const { createEntriesRouteHandlers } = await import("@/app/api/entries/route");
    const handlers = createEntriesRouteHandlers({
      db: fixture.db,
      createId: () => "api-entry",
      processAIEntry: async () => {},
      schedule: async (fn) => fn(),
    });

    const response = await handlers.POST(
      new Request("http://localhost/api/entries", {
        method: "POST",
        body: JSON.stringify({ content: 123 }),
        headers: { "content-type": "application/json" },
      }),
    );

    assert.equal(response.status, 400);
  } finally {
    fixture.cleanup();
  }
});

test("POST inserts an entry and schedules AI processing", async () => {
  const fixture = createTestDb();
  let processed: { id: string; content: string } | null = null;

  try {
    const { createEntriesRouteHandlers } = await import("@/app/api/entries/route");
    const handlers = createEntriesRouteHandlers({
      db: fixture.db,
      createId: () => "api-entry",
      processAIEntry: async (id, content) => {
        processed = { id, content };
      },
      schedule: async (fn) => fn(),
    });

    const response = await handlers.POST(
      new Request("http://localhost/api/entries", {
        method: "POST",
        body: JSON.stringify({ content: "Route created entry", createdAt: "2024-01-04" }),
        headers: { "content-type": "application/json" },
      }),
    );

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { id: "api-entry" });
    assert.deepEqual(processed, { id: "api-entry", content: "Route created entry" });
    const row = await fixture.db.query.entries.findFirst({
      where: (fields, { eq }) => eq(fields.id, "api-entry"),
    });
    assert.equal(row?.createdAt?.toISOString(), "2024-01-04T00:00:00.000Z");
  } finally {
    fixture.cleanup();
  }
});

test("GET returns newest entries first", async () => {
  const fixture = createTestDb();
  try {
    await seedEntry(fixture.db, {
      id: "older",
      content: "Older",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    });
    await seedEntry(fixture.db, {
      id: "newer",
      content: "Newer",
      createdAt: new Date("2024-01-02T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
    });

    const { createEntriesRouteHandlers } = await import("@/app/api/entries/route");
    const handlers = createEntriesRouteHandlers({
      db: fixture.db,
      createId: () => "unused",
      processAIEntry: async () => {},
      schedule: async (fn) => fn(),
    });

    const response = await handlers.GET(
      new Request("http://localhost/api/entries?limit=10&offset=0"),
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body[0].id, "newer");
    assert.equal(body[1].id, "older");
  } finally {
    fixture.cleanup();
  }
});
