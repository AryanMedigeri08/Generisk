import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
const roots = new Set([
  "auth",
  "me",
  "private",
  "invitations",
  "joints",
  "professional",
  "reports",
]);

function denied(status = 403) {
  return Response.json(
    {
      error: {
        code: "DEMO_REQUEST_REJECTED",
        message: "The demonstration request could not be verified.",
      },
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const configured = new URL(
    process.env.DEMO_WEB_ORIGIN ?? "http://localhost:13000",
  );
  const origin = request.headers.get("origin");
  if (
    !roots.has(path[0]) ||
    path.some((segment) => !/^[a-zA-Z0-9-]+$/.test(segment)) ||
    request.nextUrl.search
  )
    return denied(404);
  if (
    request.headers.get("x-demo-request") !== "1" ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return denied();
  if (request.method !== "GET" && !origin) return denied();
  if (origin) {
    try {
      const supplied = new URL(origin);
      if (
        supplied.protocol !== configured.protocol ||
        supplied.port !== configured.port ||
        !["localhost", "127.0.0.1"].includes(supplied.hostname) ||
        supplied.pathname !== "/" ||
        supplied.search ||
        supplied.hash ||
        supplied.username
      )
        return denied();
    } catch {
      return denied();
    }
  }
  const headers: Record<string, string> = {
    "X-Demo-Request": "1",
    Origin: origin ?? configured.origin,
  };
  for (const name of ["cookie", "x-csrf-token"]) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  let body: string | undefined;
  if (request.method === "POST") {
    if (
      !request.headers.get("content-type")?.startsWith("application/json") ||
      Number(request.headers.get("content-length") ?? 0) > 4096
    )
      return denied(413);
    body = await request.text();
    if (new TextEncoder().encode(body).length > 4096) return denied(413);
    headers["Content-Type"] = "application/json";
  }
  try {
    const upstream = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:18000"}/api/v1/${path.join("/")}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
        redirect: "error",
      },
    );
    const data: unknown = await upstream.json();
    const response = Response.json(data, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store", "X-Demo-Only": "true" },
    });
    for (const cookie of upstream.headers.getSetCookie())
      response.headers.append("Set-Cookie", cookie);
    return response;
  } catch {
    return Response.json(
      {
        error: {
          code: "DEMO_UNAVAILABLE",
          message: "The local demonstration service is unavailable.",
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
