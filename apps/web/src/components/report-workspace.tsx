"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  identityApi,
  type DemoSession,
  type Permission,
  type PrivateCase,
} from "../lib/identity";
import type {
  Fixture,
  ImportReceipt,
  ReportDetail,
  ReportHistory,
  ReportMetadata,
  GeneReportContent,
} from "../lib/reports";
import type { PanelData } from "../lib/panel";

function GeneFields({
  content,
  panel,
}: {
  content: GeneReportContent;
  panel: PanelData | null;
}) {
  const reference =
    panel?.panel_version === content.panel_version ? panel : null;
  return (
    <>
      <p>
        <strong>
          Generisk demo panel, illustrative subset, NOT the Abu Dhabi clinical
          panel.
        </strong>
      </p>
      <p className="source-digest">
        Recorded panel SHA-256: <bdi>{content.panel_version}</bdi>
      </p>
      <h4>Gene-level synthetic statuses</h4>
      <p>
        These are fictional fixture fields, not variant interpretation,
        diagnosis or a risk estimate. Public condition names below are reference
        associations, not inferred outcomes.
      </p>
      {!reference && (
        <p>
          Matching public panel reference unavailable. No interpretation or
          values inferred.
        </p>
      )}
      <ul>
        {content.observations.map((observation) => {
          const gene = reference?.panel.genes.find(
            (g) => g.gene_symbol === observation.gene_symbol,
          );
          return (
            <li key={observation.id} className="gene-observation">
              <strong>
                <bdi>{observation.gene_symbol}</bdi>:{" "}
                {observation.status.replaceAll("_", " ")}
              </strong>{" "}
              ({observation.validity})
              {gene && (
                <>
                  <p>
                    Public reference conditions:{" "}
                    {gene.conditions.map((c) => c.name_en).join("; ")}.{" "}
                    <span className="basis-badge">
                      {gene.engine_support.replaceAll("_", " ")}
                    </span>
                  </p>
                  <p>
                    {Object.entries(gene.reference_values).map(
                      ([key, value]) => (
                        <span key={key} className="basis-badge">
                          {key.replaceAll("_", " ")}:{" "}
                          {value.value === null ? "unavailable" : value.value} ·{" "}
                          {value.basis}{" "}
                        </span>
                      ),
                    )}
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <h4>Gene coverage — unknown is not absent</h4>
      {content.coverage ? (
        <>
          <p>Included genes: {content.coverage.included_genes.join(", ")}.</p>
          <p>
            Excluded genes:{" "}
            {content.coverage.excluded_genes.join(", ") || "None declared"}.
          </p>
          <p>
            Limitations: {content.coverage.limitations.join(", ")}. Excluded,
            uncertain, missing or not tested means unknown, not absent.
          </p>
        </>
      ) : (
        <p>Coverage missing; review required. Unknown, not absent.</p>
      )}
    </>
  );
}

type Props = {
  session: DemoSession;
  currentCase?: PrivateCase;
  permissions: Permission[];
  refresh: () => Promise<void>;
  perform: (operation: () => Promise<void>) => Promise<void>;
};

export function ReportWorkspace({
  session,
  currentCase,
  permissions,
  refresh,
  perform,
}: Props) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selected, setSelected] = useState("fixture-a-complete");
  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [receipt, setReceipt] = useState<ImportReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [geneFixtures, setGeneFixtures] = useState<Fixture[]>([]);
  const [selectedGene, setSelectedGene] = useState("");
  const [panelData, setPanelData] = useState<PanelData | null>(null);
  const inputVersion = currentCase?.input_version;
  const processing = permissions.some(
    (p) =>
      p.scope === "processing" &&
      p.case_id === currentCase?.id &&
      p.target_version === inputVersion &&
      p.state === "granted",
  );

  useEffect(() => {
    let cancelled = false;
    identityApi<Fixture[]>("reports/gene-fixtures")
      .then((options) => {
        if (!cancelled) {
          setGeneFixtures(options);
          setSelectedGene(
            options.find((f) => f.operation === "import")?.id ?? "",
          );
        }
      })
      .catch(() => {
        if (!cancelled) setGeneFixtures([]);
      });
    identityApi<PanelData>("panel")
      .then((value) => {
        if (!cancelled && Array.isArray(value?.panel?.genes))
          setPanelData(value);
      })
      .catch(() => {
        if (!cancelled) setPanelData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session.user_id]);

  useEffect(() => {
    let cancelled = false;
    async function read() {
      setDetail(null);
      setReports([]);
      setHistory([]);
      setError("");
      try {
        const options = await identityApi<Fixture[]>("reports/fixtures");
        if (!cancelled) {
          setFixtures(options);
          setSelected(
            options.find((item) => item.operation === "import")?.id ?? "",
          );
        }
        if (processing) {
          const [items, events] = await Promise.all([
            identityApi<ReportMetadata[]>("reports"),
            identityApi<ReportHistory[]>("reports/history"),
          ]);
          if (!cancelled) {
            setReports(items);
            setHistory(events);
          }
        }
      } catch {
        if (!cancelled)
          setError(
            "Report access is unavailable. Refresh private state to verify your session and processing choice.",
          );
      }
    }
    void read();
    return () => {
      cancelled = true;
    };
  }, [session.user_id, inputVersion, processing]);

  async function operate(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await perform(async () => {
        // Clear any previously viewed data before the authoritative access/permission recheck.
        setDetail(null);
        setReports([]);
        setHistory([]);
        await work();
      });
    } finally {
      setBusy(false);
    }
  }

  async function reloadReports() {
    const [items, events] = await Promise.all([
      identityApi<ReportMetadata[]>("reports"),
      identityApi<ReportHistory[]>("reports/history"),
    ]);
    setReports(items);
    setHistory(events);
  }

  async function importFixture() {
    if (!currentCase) return;
    await operate(async () => {
      const outcome = await identityApi<ImportReceipt>(
        "reports/import",
        session.csrf_token,
        {
          fixture_id: selected,
          expected_input_version: currentCase.input_version,
          idempotency_key: crypto.randomUUID(),
        },
      );
      setReceipt(outcome);
      await refresh();
      if (outcome.current_input_version === currentCase.input_version)
        await reloadReports();
    });
  }

  async function applyCorrection(
    report: ReportMetadata,
    fixtureId = "fixture-a-amend",
  ) {
    if (!currentCase) return;
    await operate(async () => {
      const outcome = await identityApi<ImportReceipt>(
        "reports/amend",
        session.csrf_token,
        {
          fixture_id: fixtureId,
          report_handle: report.report_handle,
          expected_revision:
            report.versions[report.versions.length - 1].version,
          expected_input_version: currentCase.input_version,
          idempotency_key: crypto.randomUUID(),
        },
      );
      setReceipt(outcome);
      await refresh();
      if (outcome.current_input_version === currentCase.input_version)
        await reloadReports();
    });
  }

  async function selectGeneScenario(fixtureId: string) {
    if (!currentCase) return;
    await operate(async () => {
      const outcome = await identityApi<ImportReceipt>(
        "reports/scenario",
        session.csrf_token,
        {
          fixture_id: fixtureId,
          expected_input_version: currentCase.input_version,
          idempotency_key: crypto.randomUUID(),
        },
      );
      setReceipt(outcome);
      await refresh();
      if (outcome.current_input_version === currentCase.input_version)
        await reloadReports();
    });
  }

  return (
    <section
      className="identity-card report-workspace"
      aria-labelledby="reports-title"
    >
      <h2 id="reports-title">Choose a sample report</h2>
      <p>
        Choose a gene-level example below to use in your result. After changing
        the report,{" "}
        <a href="#workspace-permissions">
          allow processing for the new version
        </a>
        , then <a href="#risk-title">open your result</a>.
      </p>
      <p>
        <strong>
          Synthetic Genetic Report — Demonstration Only — Not Medical Advice
        </strong>
      </p>
      <p>
        <Link href="/panel">Explore gene names and sources</Link>
      </p>
      {!processing && (
        <p className="report-permission" role="status">
          Current processing permission is required. Review your own processing
          choice above.
        </p>
      )}
      {error && <p role="status">{error}</p>}
      {geneFixtures.length > 0 && (
        <div className="inline-form gene-scenario-controls">
          <label>
            Gene-level synthetic scenario
            <select
              value={selectedGene}
              disabled={busy}
              onChange={(event) => setSelectedGene(event.target.value)}
            >
              {geneFixtures
                .filter((f) => f.operation === "import")
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
            </select>
          </label>
          <button
            disabled={busy || !processing || !selectedGene}
            onClick={() => void selectGeneScenario(selectedGene)}
          >
            Select gene-level scenario
          </button>
          <p>
            One gene scenario is selected per case. Changes require fresh
            processing and joint permissions. An original source cannot be
            selected again after it has been amended.
          </p>
        </div>
      )}
      <details className="demo-credentials">
        <summary>Other samples and validation tools</summary>
        <div className="inline-form">
          <label>
            Allowlisted synthetic fixture
            <select
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              disabled={busy}
            >
              {fixtures
                .filter((item) => item.operation === "import")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
            </select>
          </label>
          <button
            disabled={busy || !processing || !selected}
            onClick={() => void importFixture()}
          >
            Import selected fixture
          </button>
          <button
            disabled={busy || !processing}
            onClick={() =>
              void operate(async () => {
                await refresh();
                await reloadReports();
              })
            }
          >
            Refresh reports
          </button>
        </div>
      </details>
      {receipt && (
        <div className="report-receipt" role="status" aria-live="polite">
          <h3>Validation outcome: {receipt.category.replaceAll("_", " ")}</h3>
          <p>
            {receipt.reason_codes
              .map((code) => code.replaceAll("_", " "))
              .join("; ")}
            . Structural validation is not clinical validation.
          </p>
          <p>
            Input version after operation: {receipt.input_version_after}.{" "}
            {receipt.replayed ? "Idempotent replay; no new revision." : ""}
          </p>
          {receipt.category === "review_required" && (
            <p>
              Non-interpretable review state. Missing coverage never implies
              absence of genetic risk.
            </p>
          )}
        </div>
      )}
      {processing && reports.length === 0 && (
        <p>
          No report metadata is currently loaded. Refresh reports to check
          authorized records.
        </p>
      )}
      {processing &&
        reports.map((report) => (
          <article
            key={report.report_handle}
            className="report-record"
            data-report-source={report.source_report_id}
          >
            <h3>
              <bdi>{report.source_report_id}</bdi>
            </h3>
            {report.selected_gene_scenario !== null &&
              report.selected_gene_scenario !== undefined && (
                <p>
                  <span className="basis-badge">
                    {report.selected_gene_scenario
                      ? "Current gene scenario"
                      : "Historical gene scenario"}
                  </span>
                </p>
              )}
            <p>
              {report.active_revision_handle
                ? "Active structurally supported revision present"
                : "No active supported revision; review required"}
              .
            </p>
            <ol className="report-versions">
              {report.versions.map((version) => (
                <li key={version.revision_handle}>
                  <span>
                    Revision {version.version}:{" "}
                    <strong>{version.state.replaceAll("_", " ")}</strong>
                  </span>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void operate(async () => {
                        const item = await identityApi<ReportDetail>(
                          "reports/view",
                          session.csrf_token,
                          {
                            report_handle: report.report_handle,
                            revision_handle: version.revision_handle,
                          },
                        );
                        await reloadReports();
                        setDetail(item);
                      })
                    }
                  >
                    View revision {version.version}
                  </button>
                </li>
              ))}
            </ol>
            {report.source_report_id === "syn-report-a-complete" &&
              report.versions.length === 1 && (
                <button
                  disabled={busy}
                  onClick={() => void applyCorrection(report)}
                >
                  Apply predefined correction
                </button>
              )}
            {report.source_report_id === "syn-report-a-v2-none" &&
              report.versions.length === 1 && (
                <button
                  disabled={busy}
                  onClick={() =>
                    void applyCorrection(report, "fixture-a-v2-amend-none-cftr")
                  }
                >
                  Apply gene-level correction
                </button>
              )}
            {report.selected_gene_scenario === false && (
              <button
                disabled={busy}
                onClick={() =>
                  void selectGeneScenario(
                    report.versions[report.versions.length - 1].fixture_id,
                  )
                }
              >
                Select latest gene scenario
              </button>
            )}
          </article>
        ))}
      {processing && detail && (
        <article
          className="report-detail"
          aria-labelledby="report-detail-title"
        >
          <h3 id="report-detail-title">
            Fictional report fields — revision {detail.revision.version}
          </h3>
          <p>
            <strong>{detail.disclaimer}</strong> State:{" "}
            {detail.revision.state.replaceAll("_", " ")}.
          </p>
          <dl className="report-provenance">
            <dt>Schema</dt>
            <dd>
              {detail.content.schema_version} (FHIR-inspired; not conformance
              tested)
            </dd>
            <dt>Fictional laboratory</dt>
            <dd>
              <bdi>{detail.content.laboratory_id}</bdi>
            </dd>
            <dt>Fictional sample</dt>
            <dd>
              <bdi>{detail.content.sample.id}</bdi>
            </dd>
            <dt>Panel</dt>
            <dd>
              <bdi>{detail.content.panel}</bdi>
            </dd>
            <dt>Source created / issued</dt>
            <dd>
              {detail.content.created_at} / {detail.content.issued_at}
            </dd>
            <dt>Imported / validated</dt>
            <dd>
              {detail.revision.imported_at} / {detail.revision.validated_at}
            </dd>
            <dt>Source provenance</dt>
            <dd>
              <bdi>{detail.content.provenance.source_id}</bdi>; source version{" "}
              {detail.content.provenance.source_version};{" "}
              {detail.content.provenance.generated_by}
            </dd>
            <dt>Source SHA-256</dt>
            <dd className="source-digest">
              <bdi>{detail.revision.source_sha256}</bdi>
            </dd>
            <dt>Amendment</dt>
            <dd>
              {detail.revision.amendment_reason?.replaceAll("-", " ") ??
                "Original source revision"}
            </dd>
          </dl>
          {detail.content.schema_version === "amanah-report-2" ? (
            <GeneFields content={detail.content} panel={panelData} />
          ) : (
            <>
              <h4>Explicit coverage and limitations</h4>
              {detail.content.coverage ? (
                <>
                  <p>
                    Included fictional markers:{" "}
                    {detail.content.coverage.included.join(", ")}.
                  </p>
                  <p>
                    Excluded fictional markers:{" "}
                    {detail.content.coverage.excluded.join(", ") ||
                      "None declared"}
                    .
                  </p>
                  <p>
                    Limitations:{" "}
                    {detail.content.coverage.limitations.join(", ")}. Coverage
                    never establishes absence of genetic risk.
                  </p>
                </>
              ) : (
                <p>
                  Coverage missing. Non-interpretable review required; no
                  absence-of-risk inference.
                </p>
              )}
              <h4>Fictional observations — no clinical meaning</h4>
              <ul>
                {detail.content.observations.map((observation) => (
                  <li key={observation.id}>
                    <bdi>{observation.marker}</bdi>:{" "}
                    <bdi>{observation.value ?? "No recorded value"}</bdi> (
                    {observation.validity})
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>
      )}
      {processing && history.length > 0 && (
        <details className="report-history">
          <summary>Own import and amendment history</summary>
          <ol>
            {history.map((event) => (
              <li key={event.outcome_handle}>
                {event.operation}: {event.category.replaceAll("_", " ")} ·{" "}
                {event.created_at} · <bdi>{event.fixture_id}</bdi>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
