"use client";
import { useContent } from "../../content/locale";
import { useRef, useState } from "react";
import { interpolate } from "../../content/loader";
import {
  MENDELIAN,
  EXPECTED_AFFECTED_IN_HUNDRED,
  type Outcome,
} from "../../lib/learn/mendelian";
import {
  sample,
  tally,
  tenRuns,
  makeSampler,
} from "../../lib/learn/simulation";
const categories = ["affected", "carrier", "neither"] as const;
function ModelPattern() {
  const content = useContent();
  const { ui } = content;
  return (
    <p className="model-pattern">
      {interpolate(
        ui.model_pattern,
        Object.fromEntries(
          categories.map((k) => [
            k,
            `${MENDELIAN[k].num} ${ui.in} ${MENDELIAN[k].den}`,
          ]),
        ),
      )}
    </p>
  );
}
export function NextHundred() {
  const content = useContent();
  const { ui } = content;
  const [seed, setSeed] = useState(20261119);
  const draws = sample(seed, 100),
    counts = tally(draws),
    runs = tenRuns(seed);
  return (
    <div className="next-hundred">
      <ModelPattern />
      <div className="simulation-toolbar">
        <span>
          {ui.seed}: <bdi>{seed}</bdi>
        </span>
        <button type="button" onClick={() => setSeed((s) => s + 1)}>
          {ui.run_again}
        </button>
      </div>
      <figure>
        <div className="family-dots" aria-hidden="true">
          {draws.map((outcome, i) => (
            <span key={i} className={`family-dot ${outcome}`}>
              {outcome === "affected" ? (
                <svg viewBox="0 0 20 20">
                  <path d="M10 1 19 10 10 19 1 10Z" />
                </svg>
              ) : outcome === "carrier" ? (
                <svg viewBox="0 0 20 20">
                  <path d="M10 1 19 19 1 19Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" />
                </svg>
              )}
            </span>
          ))}
        </div>
        <figcaption>{ui.next100_legend}</figcaption>
      </figure>
      <dl className="simulation-counts" aria-live="polite">
        {categories.map((k) => (
          <div key={k} className={k}>
            <dt>{ui[k]}</dt>
            <dd>{interpolate(ui.count, { count: counts[k] })}</dd>
          </div>
        ))}
      </dl>
      <p>{ui.simulation_note}</p>
      <h3>
        {interpolate(ui.runs_heading, {
          expected: EXPECTED_AFFECTED_IN_HUNDRED,
        })}
      </h3>
      <ol className="run-strip">
        {runs.map((run, i) => (
          <li key={run.seed}>
            <span>{interpolate(ui.run, { number: i + 1 })}</span>
            <strong>{run.counts.affected}</strong>
            <span>{ui.affected}</span>
            <span>
              {ui.seed}: {run.seed}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
export function OnePregnancy() {
  const content = useContent();
  const { ui } = content;
  const [draws, setDraws] = useState<{ index: number; state: Outcome }[]>([]);
  const sampler = useRef(makeSampler(20261119)),
    ordinal = useRef(0);
  function draw() {
    const state = sampler.current();
    ordinal.current += 1;
    const index = ordinal.current;
    setDraws((old) => [...old, { index, state }].slice(-20));
  }
  function reset() {
    sampler.current = makeSampler(20261119);
    ordinal.current = 0;
    setDraws([]);
  }
  return (
    <div className="one-pregnancy">
      <ModelPattern />
      <p className="independence-note">{ui.independence}</p>
      <div className="simulation-toolbar">
        <button onClick={draw}>{ui.draw}</button>
        <button onClick={reset}>{ui.reset_history}</button>
      </div>
      <h3>{ui.history}</h3>
      {!draws.length ? (
        <p>{ui.empty_history}</p>
      ) : (
        <ol className="pregnancy-history" aria-live="polite">
          {draws.map(({ state, index }) => (
            <li key={index} className={state}>
              {interpolate(ui.draw_label, {
                number: index,
                outcome: ui[state],
              })}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
