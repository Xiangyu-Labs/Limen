import test from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { entries } from "@/lib/db/schema";
import { createTestDb } from "./helpers/test-db";
import { seedEntry } from "./helpers/test-entries";

test("processAIEntry marks an entry done with structured metadata on success", async () => {
  const fixture = createTestDb();
  let capturedRequest: any = null;
  try {
    await seedEntry(fixture.db, {
      id: "entry-success",
      content: "Today I wrote tests.",
      aiStatus: "pending",
      tags: JSON.stringify(["journal", "testing"]),
    });

    const { createAIProcessor } = await import("@/lib/ai/processor");
    const processor = createAIProcessor({
      db: fixture.db,
      client: {
        chat: {
          completions: {
            create: async (input: any) => {
              capturedRequest = input;
              return ({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      title: "我今天重新把测试补好了",
                      summary: "我把测试重新补齐了，心里踏实了很多。",
                      tags: ["testing", "journal"],
                    }),
                  },
                },
              ],
            })},
          },
        },
      },
    });

    await processor("entry-success", "Today I wrote tests.");

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-success"),
    });

    assert.equal(row?.aiStatus, "done");
    assert.equal(row?.title, "我今天重新把测试补好了");
    assert.equal(row?.summary, "我把测试重新补齐了，心里踏实了很多。");
    assert.equal(row?.tags, JSON.stringify(["testing", "journal"]));
    assert.match(capturedRequest.messages[0].content, /第一人称|“我”的视角|现有标签/);
    assert.match(capturedRequest.messages[0].content, /最多 10 个/);
    assert.match(capturedRequest.messages[0].content, /journal, testing/);
  } finally {
    fixture.cleanup();
  }
});

test("processAIEntry marks an entry failed when AI returns invalid JSON", async () => {
  const fixture = createTestDb();
  try {
    await seedEntry(fixture.db, {
      id: "entry-failure",
      content: "Broken response",
      aiStatus: "pending",
    });

    const { createAIProcessor } = await import("@/lib/ai/processor");
    const processor = createAIProcessor({
      db: fixture.db,
      client: {
        chat: {
          completions: {
            create: async () => ({
              choices: [{ message: { content: "not-json" } }],
            }),
          },
        },
      },
    });

    await processor("entry-failure", "Broken response");

    const row = await fixture.db.query.entries.findFirst({
      where: eq(entries.id, "entry-failure"),
    });

    assert.equal(row?.aiStatus, "failed");
    assert.equal(row?.title, null);
    assert.equal(row?.summary, null);
  } finally {
    fixture.cleanup();
  }
});
