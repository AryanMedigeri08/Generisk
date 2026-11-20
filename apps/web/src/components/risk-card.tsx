"use client";

import { useState } from "react";
import { useContent } from "../content/locale";
import { ResultExplainer } from "./learn/result-explainer";
import type { RiskEnvelope } from "../lib/learn/risk";
import { retrieveGuide } from "../lib/journey-demo";
import { PersonalMode } from "./care-atlas/care-atlas";
import "../app/care-atlas/atlas.css";
import {
  identityApi,
  DemoRequestError,
  type DemoSession,
  type PrivateCase,
  type Permission,
  type Joint,
} from "../lib/identity";

export type RiskOutput = RiskEnvelope;
type Props = {
  session: DemoSession;
  currentCase?: PrivateCase;
  permissions: Permission[];
  joints: Joint[];
  refresh: () => Promise<void>;
  perform: (work: () => Promise<void>) => Promise<void>;
  parentBusy?: boolean;
};

export function RiskCard({
  session,
  currentCase,
  permissions,
  joints,
  refresh,
  perform,
  parentBusy = false,
}: Props) {
  const content = useContent();
  const { ui } = content;
  const [own, setOwn] = useState<RiskOutput | null>(null);
  const [couple, setCouple] = useState<RiskOutput | null>(null);
  const [pins, setPins] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [localBusy, setBusy] = useState(false);
  const busy = localBusy || parentBusy;
  const [jointId, setJointId] = useState("");
  const [openedJourney, setOpenedJourney] = useState<{
    stamp: string;
    binding: string;
    preset: string;
  }>();
  const joint =
    joints.find((j) => j.id === jointId) ??
    (joints.length === 1 ? joints[0] : undefined);
  const permissionStamp = JSON.stringify(
    permissions.map((p) => [p.id, p.version, p.state]),
  );
  const stamp = JSON.stringify([
    permissionStamp,
    currentCase?.input_version,
    session.user_id,
    joint?.id,
    joint?.version,
  ]);
  const [outputStamp, setOutputStamp] = useState("");

  async function calculate(kind: "my-assessment" | "couple-assessment") {
    setBusy(true);
    setMessage("");
    setOwn(null);
    setCouple(null);
    setOpenedJourney(undefined);
    try {
      const response = await fetch(`/api/p03/risk/${kind}`, {
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "X-Demo-Request": "1",
          ...(kind === "couple-assessment" && joint
            ? { "X-Risk-Joint": joint.id }
            : {}),
          ...(pins[kind] ? { "X-Risk-Binding": pins[kind] } : {}),
        },
      });
      const output = await response.json();
      if (!response.ok)
        throw new DemoRequestError(
          output.error?.code ?? "UNAVAILABLE",
          output.error?.message ?? "risk.unavailable",
        );
      if (output.bindings?.scope_hash)
        setPins((p) => ({ ...p, [kind]: output.bindings.scope_hash }));
      if (kind === "my-assessment") setOwn(output);
      else setCouple(output);
      setOutputStamp(stamp);
    } catch (error) {
      setMessage(
        error instanceof DemoRequestError ? error.code : "UNAVAILABLE",
      );
    } finally {
      setBusy(false);
    }
  }
  async function choice(
    scope: "assessment" | "disclosure",
    decision: "grant" | "withdraw",
  ) {
    if (!currentCase || (scope === "disclosure" && !joint)) return;
    const target =
      scope === "assessment"
        ? currentCase.input_version
        : joint!.output_version;
    const key =
      scope === "assessment"
        ? `assessment:${currentCase.id}:v${target}:educational_risk`
        : `disclosure:${joint!.id}:v${target}:participants:educational_risk`;
    const prior = permissions.find((p) => p.scope_key === key);
    setOwn(null);
    setCouple(null);
    await perform(async () => {
      await identityApi("me/consents", session.csrf_token, {
        scope,
        purpose: "educational_risk",
        case_id: scope === "assessment" ? currentCase.id : null,
        joint_id: scope === "disclosure" ? joint!.id : null,
        target_version: target,
        audience: "participants",
        decision,
        expected_version: prior?.version ?? 0,
        idempotency_key: crypto.randomUUID(),
      });
      await refresh();
    });
  }
  function renderOutput(output: RiskOutput | null, title: string) {
    if (!output) return null;
    return (
      <section aria-label={title} className="risk-output">
        <h3>{title}</h3>
        <p>{output.label}</p>
        <ResultExplainer output={output} />
        {output.contract_version === "gen-risk-1" &&
          output.state !== "UNAVAILABLE" &&
          output.bindings?.scope_hash && (
            <div className="demo-result-journey">
              <details>
                <summary>Counselling preparation from public sources</summary>
                {retrieveGuide(
                  output.state === "SHARED_CARRIER"
                    ? ["inheritance", "counselling"]
                    : ["scope", "counselling"],
                ).map((card) => (
                  <article className="journey-note" key={card.id}>
                    <h4>{card.title.en}</h4>
                    <p>{card.summary.en}</p>
                    <p>{card.prompt.en}</p>
                    <a href={card.source} target="_blank" rel="noreferrer">
                      MedlinePlus Genetics ↗
                    </a>
                  </article>
                ))}
              </details>
              <button
                type="button"
                disabled={busy || !output.bindings.scope_hash}
                onClick={async () => {
                  setOpenedJourney(undefined);
                  setBusy(true);
                  setMessage("");
                  try {
                    const shared = output === couple;
                    const response = await fetch(
                      "/api/p03/risk/" +
                        (shared ? "couple-assessment" : "my-assessment"),
                      {
                        cache: "no-store",
                        credentials: "same-origin",
                        headers: {
                          "X-Demo-Request": "1",
                          "X-Risk-Binding": output.bindings!.scope_hash!,
                          ...(shared && joint
                            ? { "X-Risk-Joint": joint.id }
                            : {}),
                        },
                      },
                    );
                    const current = (await response.json()) as RiskOutput;
                    if (
                      !response.ok ||
                      current.state === "UNAVAILABLE" ||
                      current.bindings?.scope_hash !==
                        output.bindings?.scope_hash
                    )
                      throw new Error();
                    setOpenedJourney({
                      stamp,
                      binding: current.bindings!.scope_hash!,
                      preset:
                        current.state === "NO_SHARED_FINDING" ||
                        current.state === "OWN_NO_FINDING"
                          ? "follow-up"
                          : "result",
                    });
                  } catch {
                    setOwn(null);
                    setCouple(null);
                    setMessage("UNAVAILABLE");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Plan a visit from this result
              </button>
              {openedJourney?.stamp === stamp &&
                openedJourney.binding === output.bindings.scope_hash && (
                  <div
                    className="care-atlas"
                    aria-label="Linked fictional care journey"
                  >
                    <PersonalMode initialJourney={openedJourney.preset} />
                  </div>
                )}
            </div>
          )}
        <details className="risk-technical">
          <summary>{ui.technical}</summary>
          <p>{output.state}</p>
          <p>{output.message_keys.join(" · ")}</p>
          <ul>
            {output.genes?.map((g) => (
              <li key={g.gene_symbol}>
                <bdi>{g.gene_symbol}</bdi>: {g.state}
                {Object.entries(g.numbers).map(([key, value]) => (
                  <span key={key}>
                    {" "}
                    · {key} {value.exact.num}/{value.exact.den} (
                    {value.natural_frequency.k} in {value.natural_frequency.n})
                    · {value.basis}
                  </span>
                ))}
                <span> {g.caveat_codes.join(" · ")}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>
    );
  }
  return (
    <section className="identity-card risk-card" aria-labelledby="risk-title">
      <h2 id="risk-title">{ui.risk_title}</h2>
      <p>
        After you select a gene-level report and renew processing, allow a
        summary, then open it below.
      </p>
      <div className="choice-buttons">
        <button
          disabled={busy || !currentCase}
          onClick={() => choice("assessment", "grant")}
        >
          {ui.grant_own}
        </button>
        <button disabled={busy} onClick={() => calculate("my-assessment")}>
          {ui.calculate_own}
        </button>
        <button
          disabled={busy || !currentCase}
          onClick={() => choice("assessment", "withdraw")}
        >
          {ui.withdraw_own}
        </button>
      </div>
      <h3>Compare with a partner</h3>
      <p>
        {joint ? (
          "Each partner needs to allow the comparison and separately choose whether to share the result."
        ) : (
          <>
            To begin, <a href="#invite-title">invite your partner</a>. Each
            person signs in separately.
          </>
        )}
      </p>
      <label htmlFor="risk-joint">{ui.risk_joint}</label>
      <select
        id="risk-joint"
        value={joint?.id ?? ""}
        disabled={busy}
        onChange={(event) => {
          setJointId(event.target.value);
          setPins({});
          setOwn(null);
          setCouple(null);
        }}
      >
        <option value="">{ui.choose_joint}</option>
        {joints.map((j) => (
          <option key={j.id} value={j.id}>
            {j.id.slice(0, 8)}
          </option>
        ))}
      </select>

      <div className="choice-buttons">
        <button
          disabled={busy || !joint}
          onClick={() => choice("disclosure", "grant")}
        >
          {ui.grant_shared}
        </button>
        <button
          disabled={busy || !joint}
          onClick={() => calculate("couple-assessment")}
        >
          {ui.calculate_shared}
        </button>
        <button
          disabled={busy || !joint}
          onClick={() => choice("disclosure", "withdraw")}
        >
          {ui.withdraw_shared}
        </button>
      </div>
      <button
        disabled={busy}
        onClick={() => {
          setPins({});
          setOwn(null);
          setCouple(null);
          setMessage("risk.new_binding_requested");
        }}
      >
        {ui.new_binding}
      </button>
      <div role="status">
        {message && (
          <>
            <p>
              {message === "risk.new_binding_requested"
                ? ui.new_binding_message
                : (content.risk.messages[
                    `risk.${message.toLowerCase()}` as keyof typeof content.risk.messages
                  ] ?? ui.explanation_unavailable)}
            </p>
            <details>
              <summary>{ui.technical}</summary>
              <code>{message}</code>
            </details>
          </>
        )}
      </div>
      {renderOutput(outputStamp === stamp ? own : null, ui.own_title)}
      {renderOutput(outputStamp === stamp ? couple : null, ui.shared_title)}
    </section>
  );
}
