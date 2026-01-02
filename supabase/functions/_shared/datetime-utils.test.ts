/**
 * Tests for datetime-utils.ts
 * Ensures timezone-aware datetime handling works correctly
 */

import { assertEquals, assertThrows } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import {
  utcNow,
  ensureAwareUTC,
  isDue,
  addSeconds,
  exponentialBackoff,
} from "./datetime-utils.ts";

Deno.test("utcNow returns valid ISO 8601 string", () => {
  const now = utcNow();

  // Should be a string
  assertEquals(typeof now, "string");

  // Should end with 'Z' (UTC indicator)
  assertEquals(now.endsWith("Z"), true);

  // Should be parseable as a Date
  const parsed = new Date(now);
  assertEquals(isNaN(parsed.getTime()), false);
});

Deno.test("ensureAwareUTC handles ISO string", () => {
  const isoString = "2026-01-02T10:00:00.000Z";
  const result = ensureAwareUTC(isoString);

  assertEquals(result, isoString);
});

Deno.test("ensureAwareUTC handles Date object", () => {
  const date = new Date("2026-01-02T10:00:00.000Z");
  const result = ensureAwareUTC(date);

  assertEquals(result, "2026-01-02T10:00:00.000Z");
});

Deno.test("ensureAwareUTC handles null", () => {
  const result = ensureAwareUTC(null);
  assertEquals(result, null);
});

Deno.test("ensureAwareUTC handles undefined", () => {
  const result = ensureAwareUTC(undefined);
  assertEquals(result, null);
});

Deno.test("ensureAwareUTC throws on invalid string", () => {
  assertThrows(
    () => {
      ensureAwareUTC("not a date");
    },
    Error,
    "Invalid date string"
  );
});

Deno.test("ensureAwareUTC throws on invalid Date", () => {
  assertThrows(
    () => {
      ensureAwareUTC(new Date("invalid"));
    },
    Error,
    "Invalid Date object"
  );
});

Deno.test("isDue returns true when scheduled time has passed", () => {
  const past = "2020-01-01T00:00:00.000Z";
  const now = "2026-01-02T10:00:00.000Z";

  const result = isDue(past, now);
  assertEquals(result, true);
});

Deno.test("isDue returns false when scheduled time is in future", () => {
  const future = "2030-01-01T00:00:00.000Z";
  const now = "2026-01-02T10:00:00.000Z";

  const result = isDue(future, now);
  assertEquals(result, false);
});

Deno.test("isDue returns true when times are equal", () => {
  const time = "2026-01-02T10:00:00.000Z";

  const result = isDue(time, time);
  assertEquals(result, true);
});

Deno.test("isDue works with Date objects", () => {
  const past = new Date("2020-01-01T00:00:00.000Z");
  const now = new Date("2026-01-02T10:00:00.000Z");

  const result = isDue(past, now);
  assertEquals(result, true);
});

Deno.test("addSeconds adds time correctly", () => {
  const base = "2026-01-02T10:00:00.000Z";
  const result = addSeconds(base, 60);

  assertEquals(result, "2026-01-02T10:01:00.000Z");
});

Deno.test("addSeconds handles negative values", () => {
  const base = "2026-01-02T10:00:00.000Z";
  const result = addSeconds(base, -60);

  assertEquals(result, "2026-01-02T09:59:00.000Z");
});

Deno.test("exponentialBackoff calculates correctly", () => {
  // Retry 0: 60 * 2^0 = 60
  assertEquals(exponentialBackoff(0, 60), 60);

  // Retry 1: 60 * 2^1 = 120
  assertEquals(exponentialBackoff(1, 60), 120);

  // Retry 2: 60 * 2^2 = 240
  assertEquals(exponentialBackoff(2, 60), 240);

  // Retry 3: 60 * 2^3 = 480
  assertEquals(exponentialBackoff(3, 60), 480);
});

Deno.test("exponentialBackoff respects max delay", () => {
  // Retry 10 would be 60 * 2^10 = 61440, but max is 3600
  assertEquals(exponentialBackoff(10, 60, 3600), 3600);
});

Deno.test("CRITICAL: timezone-aware vs naive comparison works", () => {
  // This is the test case from the bug report
  // Both timestamps are timezone-aware (have 'Z' suffix)
  const scheduledFor = "2026-01-02T10:00:00.000Z";
  const now = "2026-01-02T11:00:00.000Z";

  // This should NOT throw "can't compare offset-naive and offset-aware datetimes"
  const result = isDue(scheduledFor, now);
  assertEquals(result, true);
});

Deno.test("CRITICAL: mixed Date and string comparison works", () => {
  // Ensure we can mix Date objects and strings without errors
  const scheduledFor = new Date("2026-01-02T10:00:00.000Z");
  const now = "2026-01-02T11:00:00.000Z";

  const result = isDue(scheduledFor, now);
  assertEquals(result, true);
});
