"use client";

import { useState } from "react";
import { useContent } from "../content/locale";
import { ResultExplainer } from "./learn/result-explainer";
import type { RiskEnvelope } from "../lib/learn/risk";
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
      <p>{ui.banner}</p>
      <div className="choice-buttons">
        <button
          disabled={busy || !currentCase}
          onClick={() => choice("assessment", "grant")}
        >
          {ui.grant_own}
        </button>
        <button
          disabled={busy || !currentCase}
          onClick={() => choice("assessment", "withdraw")}
        >
          {ui.withdraw_own}
        </button>
        <button
          disabled={busy || !joint}
          onClick={() => choice("disclosure", "grant")}
        >
          {ui.grant_shared}
        </button>
        <button
          disabled={busy || !joint}
          onClick={() => choice("disclosure", "withdraw")}
        >
          {ui.withdraw_shared}
        </button>
      </div>
      <div className="choice-buttons">
        <button disabled={busy} onClick={() => calculate("my-assessment")}>
          {ui.calculate_own}
        </button>
        <button disabled={busy} onClick={() => calculate("couple-assessment")}>
          {ui.calculate_shared}
        </button>
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
      </div>
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
