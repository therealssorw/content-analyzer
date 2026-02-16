import { describe, it, expect, vi } from "vitest";

// Mock supabase to return null (no auth)
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => null),
}));

// We test the route handler by importing it directly
import { POST } from "@/app/api/analyze/route";
import { NextRequest } from "next/server";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/analyze", () => {
  it("returns 400 for missing content", async () => {
    const res = await POST(makeRequest({ type: "tweet" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing type", async () => {
    const res = await POST(makeRequest({ content: "hello" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for content exceeding 15000 chars", async () => {
    const res = await POST(makeRequest({ content: "A".repeat(15001), type: "tweet" }));
    expect(res.status).toBe(400);
  });

  it("returns mock analysis for valid request", async () => {
    const res = await POST(makeRequest({ content: "Test tweet content", type: "tweet" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.overallScore).toBeDefined();
    expect(data.mock).toBe(true);
    expect(data.provider).toBe("mock");
  });

  it("returns analysis for article type", async () => {
    const res = await POST(makeRequest({ content: "This is my article about building in public", type: "article" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.overallScore).toBeGreaterThanOrEqual(1);
    expect(data.improvements.length).toBeGreaterThanOrEqual(1);
  });
});
