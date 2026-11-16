import { getDemoSnapshot } from "../../../lib/demo";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getDemoSnapshot();
  return Response.json(snapshot, {
    status: snapshot.api === "online" ? 200 : 503,
    headers: { "Cache-Control": "no-store", "X-Demo-Only": "true" },
  });
}
