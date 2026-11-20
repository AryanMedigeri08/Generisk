"use client";
import { useContent } from "../../content/locale";
import { interpolate } from "../../content/loader";
import type { ModelNumber, RiskEnvelope } from "../../lib/learn/risk";

function text(dictionary: Record<string, string>, key: string) {
  return dictionary[key];
}
export function NaturalFrequency({ value }: { value: ModelNumber }) {
  const content = useContent();
  const { ui } = content;
  return (
    <span className="natural-frequency">
      <strong>{value.natural_frequency.k}</strong> {ui.in}{" "}
      <strong>{value.natural_frequency.n}</strong>
    </span>
  );
}
export function ExactFraction({ value }: { value: ModelNumber }) {
  return (
    <bdi>
      {value.exact.num}/{value.exact.den}
    </bdi>
  );
}
export function ResultExplainer({ output }: { output: RiskEnvelope }) {
  const content = useContent();
  const { ui, risk } = content;
  const messages = risk.messages as Record<string, string>,
    caveats = risk.caveats as Record<string, string>,
    states = risk.states as Record<string, string>;
  const keys = [
    ...output.message_keys,
    ...(output.genes ?? []).flatMap((g) => g.message_keys ?? []),
  ];
  const codes = [
    ...(output.caveat_codes ?? []),
    ...(output.genes ?? []).flatMap((g) => g.caveat_codes),
  ];
  const valid =
    (!output.contract_version ||
      output.contract_version === risk.contract_version) &&
    Boolean(states[output.state]) &&
    keys.every((k) => Boolean(messages[k])) &&
    codes.every((k) => Boolean(caveats[k])) &&
    (output.genes ?? []).every((g) => Boolean(states[g.state]));
  if (!valid)
    return (
      <p className="explanation-unavailable">{ui.explanation_unavailable}</p>
    );
  if (output.state === "UNAVAILABLE")
    return <p className="plain-unavailable">{messages["risk.unavailable"]}</p>;
  const numberStates = new Set([
    "COMPUTED",
    "SHARED_CARRIER",
    "SINGLE_CARRIER",
    "NEITHER_CARRIER",
  ]);
  function numbers(values: Record<string, ModelNumber>) {
    return (
      <dl className="explanation-numbers">
        {Object.entries(values).map(([key, value]) => (
          <div key={key}>
            <dt>
              {text(ui as unknown as Record<string, string>, `number_${key}`) ??
                ui.api_number}
            </dt>
            <dd>
              <NaturalFrequency value={value} />
              <span className="basis-badge">
                {text(
                  ui as unknown as Record<string, string>,
                  `basis_${value.basis}`,
                ) ?? ui.basis}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <div className="result-explainer">
      <p className="explanation-state">{states[output.state]}</p>
      {[...new Set(output.message_keys)].map((key) => (
        <p key={key}>{messages[key]}</p>
      ))}
      {numberStates.has(output.state) &&
        output.numbers &&
        numbers(output.numbers)}
      {output.genes?.map((g) => (
        <section key={g.gene_symbol} className="explanation-gene">
          <h4>
            <bdi>{g.gene_symbol}</bdi>
          </h4>
          <p>{states[g.state]}</p>
          {g.message_keys
            ?.filter((k) => !output.message_keys.includes(k))
            .map((k) => (
              <p key={k}>{messages[k]}</p>
            ))}
          {numberStates.has(output.state) &&
            numberStates.has(g.state) &&
            numbers(g.numbers)}
        </section>
      ))}
      {[...new Set(codes)].map((key) => (
        <p className="explanation-caveat" key={key}>
          {caveats[key]}
        </p>
      ))}
      {output.couple_state && <p>{states[output.couple_state]}</p>}
    </div>
  );
}
export function NumberMeter({
  value,
  label,
}: {
  value: ModelNumber;
  label: string;
}) {
  const content = useContent();
  const { ui } = content;
  return (
    <div className="number-meter">
      <span>{label}</span>
      <NaturalFrequency value={value} />
      <meter
        min={0}
        max={value.natural_frequency.n}
        value={value.natural_frequency.k}
        aria-label={interpolate(ui.native_bar, { label })}
      />
    </div>
  );
}
