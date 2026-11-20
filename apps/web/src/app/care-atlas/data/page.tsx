import Link from "next/link";
import { atlasTables, generateAtlasDataset } from "../../../lib/atlas-dataset";

export default function DatasetPage() {
  const data = generateAtlasDataset();
  return (
    <main id="main" tabIndex={-1} className="identity-workspace">
      <Link href="/care-atlas">← Care Atlas</Link>
      <section className="identity-card journey-studio">
        <p className="eyebrow">
          Synthetic demonstration · Not for clinical use
        </p>
        <h1>Atlas dataset</h1>
        <p>
          Reproduce the fictional ecosystem and load the geometry, networks or
          tables into your own demo tools.
        </p>
        <p>
          <strong>{data.datasetId}</strong> · {data.sites.length} facilities ·{" "}
          {data.zones.length} zones · {data.connections.length} connections ·{" "}
          {data.profiles.length} invented profiles · {data.genetics.length}{" "}
          gene-level examples · {data.pathways.length} journeys ·{" "}
          {data.scenarios.length} scenarios
        </p>
        <p>
          The live Atlas uses 12 anchor facilities and six districts for a
          readable default view. The extended dataset uses the same anchors with
          synthetic subzones, satellite sites and unrelated fixture IDs.
          Illustrative GeoJSON coordinates do not identify real services.
        </p>
        <div className="journey-grid">
          <section>
            <h3>Download package</h3>
            <ul>
              <li>
                <a href="/api/atlas/dataset?format=json">
                  All fixtures as JSON
                </a>
              </li>
              <li>
                <a href="/api/atlas/dataset?format=geojson">
                  Zones, pins and connections as GeoJSON
                </a>
              </li>
              <li>
                <a href="/api/atlas/dataset?format=sql">
                  PostgreSQL schema and seed data
                </a>
              </li>
            </ul>
          </section>
          <section>
            <h3>Download tables</h3>
            <ul>
              {atlasTables.map((table) => (
                <li key={table}>
                  <a href={"/api/atlas/dataset?format=csv&table=" + table}>
                    {table} CSV
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
