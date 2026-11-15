import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "../src/app/api/p03/[...path]/route";

describe("same-origin cookie boundary", () => {
  it("rejects cross-site requests without contacting the API", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const request = new NextRequest(
      "http://localhost:13000/api/p03/auth/logout",
      {
        method: "POST",
        headers: {
          Origin: "https://untrusted.invalid",
          "X-Demo-Request": "1",
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ path: ["auth", "logout"] }),
    });
    expect(response.status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("requires a custom header for secret-bearing GET requests", async () => {
    const response = await GET(
      new NextRequest("http://localhost:13000/api/p03/auth/session"),
      { params: Promise.resolve({ path: ["auth", "session"] }) },
    );
    expect(response.status).toBe(403);
  });

  it("does not permit arbitrary proxy roots or query strings", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost:13000/api/p03/knowledge?lookup=fictional",
        { headers: { "X-Demo-Request": "1" } },
      ),
      { params: Promise.resolve({ path: ["knowledge"] }) },
    );
    expect(response.status).toBe(404);
  });

  it("forwards HttpOnly Set-Cookie but never trusts role/identity headers", async () => {
    const upstream = Response.json(
      { csrf_token: "fictional-prelogin-value" },
      {
        headers: {
          "Set-Cookie":
            "amanah_demo_session=fictional-cookie; Path=/; HttpOnly; SameSite=Lax",
        },
      },
    );
    const fetcher = vi.fn().mockResolvedValue(upstream);
    vi.stubGlobal("fetch", fetcher);
    const request = new NextRequest(
      "http://localhost:13000/api/p03/auth/csrf",
      {
        headers: {
          "X-Demo-Request": "1",
          "X-Role": "support",
          "X-User-ID": "invented-user",
        },
      },
    );
    const response = await GET(request, {
      params: Promise.resolve({ path: ["auth", "csrf"] }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Set-Cookie")).toContain("HttpOnly");
    const forwarded = fetcher.mock.calls[0][1].headers;
    expect(forwarded).not.toHaveProperty("X-Role");
    expect(forwarded).not.toHaveProperty("X-User-ID");
  });
});
