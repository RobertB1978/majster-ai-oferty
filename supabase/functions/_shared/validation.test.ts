/**
 * Validation Utilities Tests
 * Security Pack Δ1 - Enhanced Validation
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  validateBoolean,
  validateEnum,
  validateBase64,
  validatePayloadSize,
  validateJson,
  validateDate,
} from "./validation.ts";

// ==============================================
// validateBoolean Tests
// ==============================================

Deno.test("validateBoolean - valid boolean true", () => {
  const result = validateBoolean(true, "testField");
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateBoolean - valid boolean false", () => {
  const result = validateBoolean(false, "testField");
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateBoolean - invalid string", () => {
  const result = validateBoolean("true", "testField");
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertExists(result.errors.find(e => e.includes("must be a boolean")));
});

Deno.test("validateBoolean - optional and undefined", () => {
  const result = validateBoolean(undefined, "testField", { required: false });
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateBoolean - required and undefined", () => {
  const result = validateBoolean(undefined, "testField", { required: true });
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertExists(result.errors.find(e => e.includes("is required")));
});

// ==============================================
// validateEnum Tests
// ==============================================

Deno.test("validateEnum - valid enum value", () => {
  const result = validateEnum("pending", "status", ["pending", "approved", "rejected"]);
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateEnum - invalid enum value", () => {
  const result = validateEnum("invalid", "status", ["pending", "approved", "rejected"]);
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertExists(result.errors.find(e => e.includes("must be one of")));
});

Deno.test("validateEnum - wrong type", () => {
  const result = validateEnum(123, "status", ["pending", "approved"]);
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertExists(result.errors.find(e => e.includes("must be a string")));
});

Deno.test("validateEnum - optional and undefined", () => {
  const result = validateEnum(undefined, "status", ["pending"], { required: false });
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

// ==============================================
// validateBase64 Tests
// ==============================================

Deno.test("validateBase64 - valid base64", () => {
  const result = validateBase64("SGVsbG8gV29ybGQ=", "signature");
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateBase64 - invalid base64 (special chars)", () => {
  const result = validateBase64("Hello@World!", "signature");
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertExists(result.errors.find(e => e.includes("valid base64")));
});

Deno.test("validateBase64 - exceeds max size", () => {
  const largeBase64 = "A".repeat(100001); // > 100KB default
  const result = validateBase64(largeBase64, "signature");
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertExists(result.errors.find(e => e.includes("exceeds maximum size")));
});

Deno.test("validateBase64 - custom max size", () => {
  const result = validateBase64("SGVsbG8=", "signature", { maxSize: 5 });
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
});

Deno.test("validateBase64 - optional and undefined", () => {
  const result = validateBase64(undefined, "signature", { required: false });
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

// ==============================================
// validatePayloadSize Tests
// ==============================================

Deno.test("validatePayloadSize - small payload", () => {
  const payload = { name: "test", value: 123 };
  const result = validatePayloadSize(payload);
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validatePayloadSize - exceeds default 1MB", () => {
  const payload = { data: "x".repeat(2000000) }; // > 1MB
  const result = validatePayloadSize(payload);
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertExists(result.errors.find(e => e.includes("exceeds maximum size")));
});

Deno.test("validatePayloadSize - custom max size", () => {
  const payload = { data: "x".repeat(100) };
  const result = validatePayloadSize(payload, 50); // 50 bytes
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
});

// ==============================================
// validateJson Tests
// ==============================================

Deno.test("validateJson - valid JSON string", () => {
  const result = validateJson('{"name":"test","value":123}', "data");
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateJson - invalid JSON string", () => {
  const result = validateJson('{name:"test"}', "data"); // Not valid JSON
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertExists(result.errors.find(e => e.includes("valid JSON")));
});

Deno.test("validateJson - exceeds max size", () => {
  const largeJson = '{"data":"' + "x".repeat(10001) + '"}'; // > 10KB default
  const result = validateJson(largeJson, "data");
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertExists(result.errors.find(e => e.includes("exceeds maximum size")));
});

Deno.test("validateJson - wrong type", () => {
  const result = validateJson({ name: "test" }, "data");
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertExists(result.errors.find(e => e.includes("must be a JSON string")));
});

Deno.test("validateJson - optional and undefined", () => {
  const result = validateJson(undefined, "data", { required: false });
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

// ==============================================
// validateDate Tests
// ==============================================

Deno.test("validateDate - valid ISO date", () => {
  const result = validateDate("2025-12-16T10:30:00Z", "createdAt");
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateDate - valid simple date", () => {
  const result = validateDate("2025-12-16", "createdAt");
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateDate - invalid date string", () => {
  const result = validateDate("not-a-date", "createdAt");
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertExists(result.errors.find(e => e.includes("valid ISO date")));
});

Deno.test("validateDate - wrong type", () => {
  const result = validateDate(123456789, "createdAt");
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertExists(result.errors.find(e => e.includes("must be a date string")));
});

Deno.test("validateDate - optional and undefined", () => {
  const result = validateDate(undefined, "createdAt", { required: false });
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

console.log("✅ All validation tests defined successfully");
