import test from "node:test";
import assert from "node:assert/strict";

test("formatted date uses Chinese absolute output", async () => {
  const { formatAbsoluteDate } = await import("@/components/FormattedDate");
  const date = new Date("2024-01-03T11:45:00.000Z");

  assert.match(formatAbsoluteDate(date), /2024年1月3日/);
});
