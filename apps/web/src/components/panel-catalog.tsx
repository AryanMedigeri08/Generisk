import Link from "next/link";
import type { PanelData } from "../lib/panel";

export function PanelCatalog({ data }: { data: PanelData | null }) {
  return (
    <>
      <main id="main" className="identity-workspace public-panel" tabIndex={-1}>
        <p className="eyebrow">PUBLIC REFERENCE LIBRARY</p>
        <h1>Demo gene panel</h1>
        <p>
          <strong>
            Generisk demo panel, illustrative subset, NOT the Abu Dhabi clinical
            panel.
          </strong>
        </p>
        <p>
          Public gene and condition names, with original summaries and
          attribution. No personal results, variants, risk calculations or
          clinical interpretation.
        </p>
        <p>
          “Supported” describes the bounded synthetic fixture scope for future
          work. It does not establish assay performance or clinical validity.
          Explore the <Link href="/learn">interactive lessons</Link> to learn
          about inheritance.
        </p>
        {!data ? (
          <p role="status">
            Public reference panel unavailable. No reference values have been
            invented.
          </p>
        ) : (
          <>
            <p className="source-digest">
              Panel version {data.panel.version} · SHA-256{" "}
              <bdi>{data.panel_version}</bdi>
            </p>
            <p>
              Reference rates are unavailable unless an attributed value has
              been curated. Null means unknown, never zero. Severity descriptors
              are broad and do not grade an individual.
            </p>
            <div className="panel-grid">
              {data.panel.genes.map((gene) => (
                <article
                  className="identity-card panel-gene"
                  key={gene.gene_symbol}
                  id={`gene-${gene.gene_symbol}`}
                >
                  <h2>
                    <bdi>{gene.gene_symbol}</bdi>
                  </h2>
                  <p>
                    <bdi>{gene.hgnc_id}</bdi> ·{" "}
                    <span className="basis-badge">
                      {gene.engine_support.replaceAll("_", " ")}
                    </span>
                  </p>
                  <p>{gene.support_note}</p>
                  {gene.conditions.map((condition) => (
                    <div key={condition.name_en}>
                      <h3>{condition.name_en}</h3>
                      <p>{condition.summary}</p>
                      <p>
                        Inheritance listed: autosomal recessive · severity:
                        variable · Arabic name: pending review
                      </p>
                    </div>
                  ))}
                  <dl>
                    {Object.entries(gene.reference_values).map(
                      ([key, reference]) => (
                        <div key={key}>
                          <dt>{key.replaceAll("_", " ")}</dt>
                          <dd>
                            <span className="basis-badge">
                              {reference.basis}
                            </span>{" "}
                            {reference.value === null
                              ? "Unavailable — no number"
                              : reference.value}
                            <p>{reference.note}</p>
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                  <h3>Sources and attribution</h3>
                  <ul>
                    {data.panel.sources
                      .filter(
                        (source) =>
                          source.id === gene.symbol_source_id ||
                          gene.conditions.some(
                            (condition) => condition.source_id === source.id,
                          ) ||
                          Object.values(gene.reference_values).some(
                            (reference) => reference.source_id === source.id,
                          ),
                      )
                      .map((source) => (
                        <li key={source.id}>
                          <a href={source.url}>{source.title}</a> · retrieved{" "}
                          {source.retrieved_on}
                          <p>
                            {source.field}. {source.license_note}{" "}
                            <a href={source.license_url}>Reuse terms</a>
                          </p>
                        </li>
                      ))}
                  </ul>
                </article>
              ))}
            </div>
            <p>
              Source: MedlinePlus, National Library of Medicine. Gene
              nomenclature: HGNC (CC0). Summaries use original wording; no OMIM
              or GeneReviews content is reproduced.
            </p>
          </>
        )}
      </main>
      <footer>
        <Link href="/workspace">Open the private workspace</Link>
        <span>Synthetic demonstration only. No medical advice.</span>
      </footer>
    </>
  );
}
