import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "../src/app/api/p03/[...path]/route";

describe("same-origin cookie boundary", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("allows the exact hosted origin and forwards only the demo cookie to Render", async () => {
    const origin = "https://judges.example.org";
    const api = "https://api.example.org";
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("DEMO_WEB_ORIGIN", origin);
    vi.stubEnv("API_INTERNAL_URL", api);
    const upstream = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", upstream);
    const request = (from: string) =>
      new NextRequest(origin + "/api/p03/auth/session", {
        headers: {
          Origin: from,
          "X-Demo-Request": "1",
          Cookie: "routing=private; amanah_demo_session=example",
        },
      });
    const params = { params: Promise.resolve({ path: ["auth", "session"] }) };
    expect((await GET(request("http://localhost:13000"), params)).status).toBe(
      403,
    );
    expect(
      (await GET(request("https://preview.example.org"), params)).status,
    ).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
    expect((await GET(request(origin), params)).status).toBe(200);
    expect(upstream.mock.calls[0][0]).toBe(api + "/api/v1/auth/session");
    expect(upstream.mock.calls[0][1].headers.cookie).toBe(
      "amanah_demo_session=example",
    );
    vi.stubEnv("API_INTERNAL_URL", "http://api.example.org");
    expect((await GET(request(origin), params)).status).toBe(503);
    expect(upstream).toHaveBeenCalledTimes(1);
  });
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
