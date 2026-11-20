"use client";
import { useContent } from "../../content/locale";
import { useState, type DragEvent } from "react";
import { interpolate } from "../../content/loader";
import {
  pairOutcome,
  pairTable,
  PRESETS,
  type Copy,
  type Outcome,
  type Preset,
} from "../../lib/learn/mendelian";
const label = (copy: Copy, ui: ReturnType<typeof useContent>["ui"]) =>
  copy === "working" ? ui.working : ui.changed;
export const outcomeLabel = (
  state: Outcome,
  ui: ReturnType<typeof useContent>["ui"],
) =>
  ({
    affected: ui.two_changed,
    carrier: ui.one_changed,
    neither: ui.two_working,
  })[state];
export function CopyShape({ copy }: { copy: Copy }) {
  return (
    <svg
      viewBox="0 0 60 60"
      aria-hidden="true"
      className={`copy-shape ${copy}`}
    >
      {copy === "working" ? (
        <circle cx="30" cy="30" r="22" />
      ) : (
        <path d="M30 5 55 30 30 55 5 30Z" />
      )}
      <path d="M21 30h18m-9-9v18" className="copy-mark" />
    </svg>
  );
}
export function CopiesReveal() {
  const content = useContent();
  const { ui } = content;
  const [revealed, setRevealed] = useState<boolean[]>([false, false]);
  return (
    <div className="copy-reveal">
      <div className="copy-reveal-pair">
        {[ui.copy_a, ui.copy_b].map((name, i) => (
          <button
            key={name}
            type="button"
            aria-expanded={revealed[i]}
            onClick={() =>
              setRevealed((old) =>
                old.map((value, index) => (i === index ? !value : value)),
              )
            }
          >
            <CopyShape copy="working" />
            <strong>{name}</strong>
            <span>{i === 0 ? ui.reveal_a : ui.reveal_b}</span>
            {revealed[i] && (
              <span className="reveal-answer">{ui.copy_reveal}</span>
            )}
          </button>
        ))}
      </div>
      <p className="shape-legend">{ui.shape_legend}</p>
    </div>
  );
}
export function GeneKeys() {
  const content = useContent();
  const { ui } = content;
  const [preset, setPreset] = useState<Preset>("both_carriers");
  const [chosen, setChosen] = useState<(number | null)[]>([null, null]);
  const parents = PRESETS[preset];
  function choose(parent: number, index: number) {
    setChosen((old) => old.map((value, i) => (i === parent ? index : value)));
  }
  function drop(event: DragEvent, parent: number) {
    event.preventDefault();
    try {
      const value: unknown = JSON.parse(
        event.dataTransfer.getData("application/generisk-copy"),
      );
      if (
        value &&
        typeof value === "object" &&
        "parent" in value &&
        value.parent === parent &&
        "index" in value &&
        (value.index === 0 || value.index === 1)
      )
        choose(parent, value.index);
    } catch {
      /* Invalid non-model drag data has no effect. */
    }
  }
  const a = chosen[0],
    b = chosen[1];
  return (
    <div className="gene-keys">
      <label htmlFor="gene-preset">{ui.preset}</label>
      <select
        id="gene-preset"
        value={preset}
        onChange={(e) => {
          setPreset(e.target.value as Preset);
          setChosen([null, null]);
        }}
      >
        {Object.keys(PRESETS).map((p) => (
          <option key={p} value={p}>
            {ui[p as Preset]}
          </option>
        ))}
      </select>
      <p>{ui.select_copy}</p>
      <div className="gene-parents">
        {parents.map((copies, parent) => (
          <fieldset key={parent}>
            <legend>{parent === 0 ? ui.parent_a : ui.parent_b}</legend>
            <div className="copy-buttons">
              {copies.map((copy, index) => (
                <button
                  type="button"
                  key={index}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData(
                      "application/generisk-copy",
                      JSON.stringify({ parent, index }),
                    )
                  }
                  aria-pressed={chosen[parent] === index}
                  onClick={() => choose(parent, index)}
                  aria-label={interpolate(ui.pass_copy, {
                    copy: index === 0 ? ui.copy_a : ui.copy_b,
                    parent: parent === 0 ? ui.parent_a : ui.parent_b,
                  })}
                >
                  <CopyShape copy={copy} />
                  <span>{index === 0 ? ui.copy_a : ui.copy_b}</span>
                  <strong>{label(copy, ui)}</strong>
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="child-stage">
        <h3>{ui.child}</h3>
        <div className="child-slots">
          {parents.map((copies, parent) => (
            <div
              key={parent}
              className="child-slot"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => drop(e, parent)}
            >
              <span>{parent === 0 ? ui.drop_a : ui.drop_b}</span>
              {chosen[parent] !== null ? (
                <CopyShape copy={copies[chosen[parent]!]} />
              ) : (
                <span>{ui.drop_hint}</span>
              )}
            </div>
          ))}
        </div>
        <p role="status" className="child-state">
          {a !== null && b !== null
            ? outcomeLabel(pairOutcome(parents[0][a], parents[1][b]), ui)
            : ui.select_copy}
        </p>
      </div>
      <p className="shape-legend">{ui.shape_legend}</p>
      <div className="lesson-table-wrap">
        <table>
          <caption>{ui.pair_table}</caption>
          <thead>
            <tr>
              <th scope="col">{ui.from_a}</th>
              <th scope="col">{ui.from_b}</th>
              <th scope="col">{ui.pair_state}</th>
            </tr>
          </thead>
          <tbody>
            {pairTable(preset).map((row) => (
              <tr key={row.id}>
                <td>{label(row.fromA, ui)}</td>
                <td>{label(row.fromB, ui)}</td>
                <td>{outcomeLabel(row.outcome, ui)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
