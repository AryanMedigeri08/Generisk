import {
  atlasCsv,
  atlasGeoJSON,
  atlasSql,
  atlasTables,
  generateAtlasDataset,
  type Table,
} from "../../../../lib/atlas-dataset";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const format = params.get("format") ?? "json";
  const table = params.get("table");
  const dataset = generateAtlasDataset();
  let body: string;
  let filename: string;
  let type: string;

  if (format === "json") {
    body = JSON.stringify(dataset);
    filename = "aman-atlas-synthetic.json";
    type = "application/json";
  } else if (format === "geojson") {
    body = JSON.stringify(atlasGeoJSON(dataset));
    filename = "aman-atlas-synthetic.geojson";
    type = "application/geo+json";
  } else if (format === "csv" && atlasTables.includes(table as Table)) {
    body = atlasCsv(dataset, table as Table);
    filename = "aman-synthetic-" + table + ".csv";
    type = "text/csv;charset=utf-8";
  } else if (format === "sql") {
    body = atlasSql(dataset);
    filename = "aman-atlas-synthetic.sql";
    type = "text/plain;charset=utf-8";
  } else {
    return Response.json(
      { error: "Unsupported synthetic dataset format or table" },
      { status: 400 },
    );
  }

  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": 'attachment; filename="' + filename + '"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
