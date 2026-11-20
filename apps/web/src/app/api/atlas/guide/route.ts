import { buildGuide, parseGuideRequest } from "../../../../lib/atlas-guide";

export async function GET(request: Request) {
  const input = parseGuideRequest(new URL(request.url).searchParams);
  const headers = { "Cache-Control": "no-store" };
  if (!input)
    return Response.json(
      { error: "Choose a supported educational topic and language" },
      { status: 400, headers },
    );
  return Response.json(await buildGuide(input.topic, input.locale), {
    headers,
  });
}
