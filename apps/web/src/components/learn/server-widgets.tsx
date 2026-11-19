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
  // Each intermediate circle is a generation, not an inferred family member.
  // Double first cousins share both ancestor couples through two sibling pairs.
  const ancestorXs = double ? [70, 130, 310, 370] : [150, 290];
  const intermediate = double
    ? [
        { x: 70, y: 130 },
        { x: 140, y: 130 },
        { x: 300, y: 130 },
        { x: 370, y: 130 },
      ]
    : related
      ? [
          { x: 110, y: 125 },
          { x: 330, y: 125 },
          ...(second ? [{ x: 110, y: 200 }] : []),
          ...(second || removed ? [{ x: 330, y: 200 }] : []),
        ]
      : [];
  const a = { x: double ? 105 : 110, y: removed ? 240 : 270 };
  const b = { x: double ? 335 : 330, y: removed ? 300 : 270 };
  return (
    <figure className="family-diagram">
      <svg viewBox="0 0 440 365" role="img" aria-label={ui.family_tree}>
        <g className={related ? "tree-path shared" : "tree-path"} fill="none">
          {double ? (
            <>
              <path d="M70 40H130M100 40V80H140V130M100 80H300V130" />
              <path d="M310 40H370M340 40V100H70V130M340 100H370V130" />
              <path d="M70 130H140M105 130V270M300 130H370M335 130V270" />
            </>
          ) : related ? (
            <path
              d={`M150 40H290M220 40V85H110V125M220 85H330V125M110 125V${a.y}M330 125V${b.y}`}
            />
          ) : (
            <path d="M150 40V85H110V270M290 40V85H330V270" />
          )}
          <path d={`M${a.x} ${a.y}V330H${b.x}V${b.y}M220 330V355`} />
        </g>
        {ancestorXs.map((x) => (
          <g
            key={x}
            className={related ? "ancestor-node shared" : "ancestor-node"}
          >
            <circle cx={x} cy={40} r={15} />
          </g>
        ))}
        <text x="220" y="15" textAnchor="middle">
          {ui.ancestor}
        </text>
        <g className={related ? "ancestor-node shared" : "ancestor-node"}>
          {intermediate.map(({ x, y }) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={12}
              data-generation-node="true"
            />
          ))}
        </g>
        <g className="tree-person">
          <circle cx={a.x} cy={a.y} r={18} />
          <text x={a.x} y={a.y - 25} textAnchor="middle">
            {ui.parent_node_a}
          </text>
          <circle cx={b.x} cy={b.y} r={18} />
          <text x={b.x} y={b.y - 25} textAnchor="middle">
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
