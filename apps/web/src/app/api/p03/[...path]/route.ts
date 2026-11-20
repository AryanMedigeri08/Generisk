import type { NextRequest } from "next/server";
import { apiOrigin } from "../../../../lib/api-origin";

export const dynamic = "force-dynamic";
const roots = new Set([
  "auth",
  "me",
  "private",
  "invitations",
  "joints",
  "professional",
  "reports",
  "panel",
  "risk",
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
  const publicPanel = path[0] === "panel";
  const publicWhatif =
    path[0] === "risk" && path.length === 2 && path[1] === "whatif";
  const privateRisk =
    path[0] === "risk" &&
    path.length === 2 &&
    ["my-assessment", "couple-assessment"].includes(path[1]);
  if (path[0] === "risk") {
    if (!publicWhatif && !privateRisk) return denied(404);
    if (
      (publicWhatif && request.method !== "POST") ||
      (privateRisk && request.method !== "GET")
    )
      return denied(405);
  }
  if (publicPanel && request.method !== "GET") return denied(405);
  if (publicPanel && path.length > 2) return denied(404);
  let configured: URL;
  try {
    configured = new URL(
      process.env.DEMO_WEB_ORIGIN ?? "http://localhost:13000",
    );
    if (
      process.env.VERCEL === "1" &&
      (configured.protocol !== "https:" ||
        configured.origin !== process.env.DEMO_WEB_ORIGIN)
    )
      return denied(503);
  } catch {
    return denied(503);
  }
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
      const loopback = ["localhost", "127.0.0.1"];
      const localAlias =
        loopback.includes(configured.hostname) &&
        loopback.includes(supplied.hostname) &&
        supplied.protocol === configured.protocol &&
        supplied.port === configured.port;
      if (
        origin !== supplied.origin ||
        (supplied.origin !== configured.origin && !localAlias)
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
  if (!publicPanel && !publicWhatif) {
    const session = request.cookies.get("amanah_demo_session");
    if (session)
      headers.cookie = `amanah_demo_session=${encodeURIComponent(session.value)}`;
    const token = request.headers.get("x-csrf-token");
    if (token) headers["x-csrf-token"] = token;
  }
  if (privateRisk) {
    const joint = request.headers.get("x-risk-joint");
    if (joint) {
      if (!/^[a-f0-9-]{36}$/.test(joint)) return denied(404);
      headers["X-Risk-Joint"] = joint;
    }
    const pin = request.headers.get("x-risk-binding");
    if (pin) {
      if (!/^[a-f0-9]{64}$/.test(pin)) return denied(409);
      headers["X-Risk-Binding"] = pin;
    }
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
    const upstream = await fetch(`${apiOrigin()}/api/v1/${path.join("/")}`, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
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
