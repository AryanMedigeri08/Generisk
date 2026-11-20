import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  atlasCsv,
  atlasGeoJSON,
  atlasSql,
  atlasTables,
  generateAtlasDataset,
} from "../apps/web/src/lib/atlas-dataset.ts";

const target = resolve(process.argv[2] ?? "artifacts/local/atlas-dataset");
await mkdir(target, { recursive: true });
const data = generateAtlasDataset();
await Promise.all([
  writeFile(
    resolve(target, "atlas.json"),
    JSON.stringify(data, null, 2) + "\n",
  ),
  writeFile(
    resolve(target, "atlas.geojson"),
    JSON.stringify(atlasGeoJSON(data), null, 2) + "\n",
  ),
  writeFile(resolve(target, "atlas.sql"), atlasSql(data)),
  ...atlasTables.map((table) =>
    writeFile(resolve(target, table + ".csv"), atlasCsv(data, table)),
  ),
]);
console.log(data.datasetId + " written to " + target);
