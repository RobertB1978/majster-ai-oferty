import { describe, expect, test } from "vitest";
import { getCorsHeaders, requireBearerToken } from "./security";

const dummyRequest = (headers: Record<string, string>) =>
  new Request("https://example.com/api", { headers });

describe("security helpers", () => {
  test("rejects missing bearer token", () => {
    const cors = getCorsHeaders(dummyRequest({ Origin: "http://localhost:5173" }));
    const { errorResponse } = requireBearerToken(dummyRequest({ Origin: "http://localhost:5173" }), cors);
    expect(errorResponse).toBeDefined();
    expect(errorResponse?.status).toBe(401);
  });

  test("accepts valid bearer token", () => {
    const cors = getCorsHeaders(dummyRequest({ Origin: "http://localhost:5173" }));
    const { token, errorResponse } = requireBearerToken(
      dummyRequest({ Authorization: "Bearer test", Origin: "http://localhost:5173" }),
      cors
    );
    expect(errorResponse).toBeUndefined();
    expect(token).toBe("test");
  });
});
