"use client";
import { useContent } from "../../content/locale";
import { useEffect, useRef, useState } from "react";
import {
  TEACHING_Q,
  TEACHING_C,
  TEACHING_D,
  whatIf,
  type Relationship,
  type RiskEnvelope,
} from "../../lib/learn/risk";
import {
  ExactFraction,
  NaturalFrequency,
  NumberMeter,
  ResultExplainer,
} from "./result-explainer";

function FamilyDiagram({ relationship }: { relationship: Relationship }) {
  const content = useContent();
  const { ui } = content;
  const related = relationship !== "unrelated" && relationship !== "not_sure";
  const double = relationship === "double_first_cousins";
  const removed = relationship === "first_cousins_once_removed";
  const second = relationship === "second_cousins";
  return (
    <figure className="family-diagram">
      <svg viewBox="0 0 440 270" role="img" aria-label={ui.family_tree}>
        <g className={related ? "tree-path shared" : "tree-path"} fill="none">
          <path
            d={
              related
                ? "M150 45H290M220 45V90H110V215M220 90H330V215"
                : "M150 45V90H110V215M290 45V90H330V215"
            }
          />
          {double && (
            <path d="M90 45H150M120 45V115H110M290 45H350M320 45V115H330" />
          )}
          {second && (
            <path d="M110 90V125H140V165H110M330 90V125H300V165H330" />
          )}
          {removed && <path d="M330 155V185H365V215" />}
          <path d="M110 215V240H330V215M220 240V260" />
        </g>
        {(double ? [90, 150, 290, 350] : [150, 290]).map((x) => (
          <g
            key={x}
            className={related ? "ancestor-node shared" : "ancestor-node"}
          >
            <circle cx={x} cy={45} r={18} />
          </g>
        ))}
        <text x="220" y="18" textAnchor="middle">
          {ui.ancestor}
        </text>
        <g className="tree-person">
          <circle cx="110" cy="215" r="18" />
          <text x="110" y="190" textAnchor="middle">
            {ui.parent_node_a}
          </text>
          <circle cx={removed ? 365 : 330} cy="215" r="18" />
          <text x={removed ? 365 : 330} y="190" textAnchor="middle">
            {ui.parent_node_b}
          </text>
        </g>
      </svg>
      <figcaption>
        {ui.relationships[relationship]} · {ui.family_note}
      </figcaption>
    </figure>
  );
}
function useExplicitModel() {
  const [output, setOutput] = useState<RiskEnvelope | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  function clear() {
    pending.current?.abort();
    pending.current = null;
    setOutput(null);
    setBusy(false);
    setError(false);
  }
  async function calculate(body: object) {
    clear();
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    try {
      const value = await whatIf(body, controller.signal);
      if (pending.current === controller) setOutput(value);
    } catch {
      if (pending.current === controller) setError(true);
    } finally {
      if (pending.current === controller) {
        setBusy(false);
        pending.current = null;
      }
    }
  }
  return { output, busy, error, clear, calculate };
}
export function FamilyTree() {
  const content = useContent();
  const { ui } = content;
  const [relationship, setRelationship] =
      useState<Relationship>("first_cousins"),
    [index, setIndex] = useState(0);
  const model = useExplicitModel(),
    numbers =
      model.output?.state === "COMPUTED" ? model.output.numbers : undefined;
  return (
    <div className="family-tree">
      <div className="teaching-controls">
        <label htmlFor="teaching-relationship">{ui.relationship}</label>
        <select
          id="teaching-relationship"
          value={relationship}
          onChange={(e) => {
            model.clear();
            setRelationship(e.target.value as Relationship);
          }}
        >
          {Object.entries(ui.relationships).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <label htmlFor="teaching-q">{ui.teaching_frequency}</label>
        <select
          id="teaching-q"
          value={index}
          onChange={(e) => {
            model.clear();
            setIndex(Number(e.target.value));
          }}
        >
          {TEACHING_Q.map((q, i) => (
            <option value={i} key={i}>
              {q.num}/{q.den}
            </option>
          ))}
        </select>
      </div>
      <FamilyDiagram relationship={relationship} />
      {relationship === "not_sure" && !model.output && (
        <p>{content.risk.messages["risk.counsellor_context"]}</p>
      )}
      <p className="teaching-assumption">{ui.assumption}</p>
      <button
        type="button"
        disabled={model.busy}
        onClick={() =>
          model.calculate({
            mode: "consanguinity",
            gene_symbol: "CFTR",
            relationship,
            population: "user_scenario",
            q: TEACHING_Q[index],
          })
        }
      >
        {model.busy ? ui.loading : ui.calculate}
      </button>
      <div aria-live="polite" className="server-result">
        {model.error && <p role="alert">{ui.api_error}</p>}
        {model.output && (
          <>
            <span className="basis-badge">{ui.assumed_badge}</span>
            {numbers?.related && numbers?.unrelated && (
              <div className="absolute-comparison">
                <section>
                  <h3>{ui.related}</h3>
                  <NaturalFrequency value={numbers.related} />
                </section>
                <section>
                  <h3>{ui.unrelated}</h3>
                  <NaturalFrequency value={numbers.unrelated} />
                </section>
              </div>
            )}
            {numbers?.F && (
              <p>
                {ui.coefficient}: <ExactFraction value={numbers.F} />
              </p>
            )}
            {numbers?.ratio && (
              <details>
                <summary>{ui.comparison_details}</summary>
                <p>
                  {ui.ratio}: <ExactFraction value={numbers.ratio} />
                </p>
              </details>
            )}
            {!numbers?.related && <ResultExplainer output={model.output} />}
          </>
        )}
      </div>
    </div>
  );
}
export function NegativeBar() {
  const content = useContent();
  const { ui } = content;
  const [prior, setPrior] = useState(0),
    [detection, setDetection] = useState(0),
    model = useExplicitModel();
  const numbers =
    model.output?.state === "COMPUTED" ? model.output.numbers : undefined;
  return (
    <div className="negative-bar">
      <div className="teaching-controls">
        <label htmlFor="teaching-c">{ui.teaching_prior}</label>
        <select
          id="teaching-c"
          value={prior}
          onChange={(e) => {
            model.clear();
            setPrior(Number(e.target.value));
          }}
        >
          {TEACHING_C.map((v, i) => (
            <option key={i} value={i}>
              {v.num}/{v.den}
            </option>
          ))}
        </select>
        <label htmlFor="teaching-d">{ui.teaching_detection}</label>
        <select
          id="teaching-d"
          value={detection}
          onChange={(e) => {
            model.clear();
            setDetection(Number(e.target.value));
          }}
        >
          {TEACHING_D.map((v, i) => (
            <option key={i} value={i}>
              {v.num}/{v.den}
            </option>
          ))}
        </select>
      </div>
      <p className="teaching-assumption">{ui.assumption}</p>
      <p>{ui.detection_assumption}</p>
      <button
        type="button"
        disabled={model.busy}
        onClick={() =>
          model.calculate({
            mode: "residual",
            gene_symbol: "CFTR",
            relationship: "unrelated",
            population: "user_scenario",
            c: TEACHING_C[prior],
            d: TEACHING_D[detection],
          })
        }
      >
        {model.busy ? ui.loading : ui.calculate}
      </button>
      <div aria-live="polite" className="server-result">
        {model.error && <p role="alert">{ui.api_error}</p>}
        {model.output && (
          <>
            <span className="basis-badge">{ui.assumed_badge}</span>
            {numbers?.c && (
              <NumberMeter value={numbers.c} label={ui.before} />
            )}{" "}
            {numbers?.posterior_carrier && (
              <NumberMeter value={numbers.posterior_carrier} label={ui.after} />
            )}
            <p>{content.risk.messages["risk.individual_residual_only"]}</p>
            {!numbers?.posterior_carrier && (
              <ResultExplainer output={model.output} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
