"use client";

import { useEffect, useState } from "react";
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
} from "../lib/reports";

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

  async function applyCorrection(report: ReportMetadata) {
    if (!currentCase) return;
    await operate(async () => {
      const outcome = await identityApi<ImportReceipt>(
        "reports/amend",
        session.csrf_token,
        {
          fixture_id: "fixture-a-amend",
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

  return (
    <section
      className="identity-card report-workspace"
      aria-labelledby="reports-title"
    >
      <p className="eyebrow">P04 / FICTIONAL SOURCE RECORDS</p>
      <h2 id="reports-title">Synthetic report management</h2>
      <p>
        <strong>
          Synthetic Genetic Report — Demonstration Only — Not Medical Advice
        </strong>
      </p>
      <p>
        Choose a packaged fictional fixture. There is no file upload, clinical
        interpretation, AI explanation or report retrieval corpus.
      </p>
      <p>
        Report changes supersede old input permissions. Review and grant
        processing for the new input version above before viewing again. Joint
        permissions and any old output also become unavailable.
      </p>
      {!processing && (
        <p className="report-permission" role="status">
          Current processing permission is required. Review your own processing
          choice above.
        </p>
      )}
      {error && <p role="status">{error}</p>}
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
          <h4>Explicit coverage and limitations</h4>
          {detail.content.coverage ? (
            <>
              <p>
                Included fictional markers:{" "}
                {detail.content.coverage.included.join(", ")}.
              </p>
              <p>
                Excluded fictional markers:{" "}
                {detail.content.coverage.excluded.join(", ") || "None declared"}
                .
              </p>
              <p>
                Limitations: {detail.content.coverage.limitations.join(", ")}.
                Coverage never establishes absence of genetic risk.
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
