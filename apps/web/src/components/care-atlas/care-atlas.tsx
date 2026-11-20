"use client";

import Link from "next/link";
import { useState } from "react";
import {
  districts,
  facilities,
  findServices,
  journeys,
  languages,
  referrals,
  serviceKeys,
  services,
  type DistrictId,
  type Language,
  type Service,
} from "../../lib/care-atlas";
import { AtlasMap } from "./atlas-map";
import { PolicyMode } from "./policy-mode";

const modes = [
  { id: "personal", label: "Personal" },
  { id: "ecosystem", label: "Ecosystem" },
  { id: "policy", label: "Policy" },
] as const;
type Mode = (typeof modes)[number]["id"];
type Facility = (typeof facilities)[number];

function FacilityDetails({
  facility,
  distance,
}: {
  facility: Facility;
  distance?: number;
}) {
  const district = districts.find(
    (district) => district.id === facility.district,
  )!;
  return (
    <div className="atlas-detail" aria-live="polite">
      <div>
        <p className="atlas-kicker">Simulated facility · {district.name}</p>
        <h3>{facility.name}</h3>
        <p>
          {facility.services
            .map((service) => services[service].name)
            .join(" · ")}
        </p>
      </div>
      <dl>
        {distance !== undefined && (
          <div>
            <dt>Illustrative distance</dt>
            <dd>{distance.toFixed(1)} km straight-line</dd>
          </div>
        )}
        <div>
          <dt>Languages</dt>
          <dd>{facility.languages.join(", ")}</dd>
        </div>
        <div>
          <dt>Step-free entry</dt>
          <dd>
            {facility.stepFree
              ? "Available in this scenario"
              : "Unavailable in this scenario"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function PersonalMode() {
  const [journeyIndex, setJourney] = useState(0);
  const [stepIndex, setStep] = useState(0);
  const [originId, setOrigin] = useState<DistrictId>("south");
  const [language, setLanguage] = useState<Language | "">("");
  const [stepFree, setStepFree] = useState(false);
  const [selectedId, setSelected] = useState<string>();
  const journey = journeys[journeyIndex];
  const step = journey.steps[stepIndex];
  const origin = districts.find((district) => district.id === originId)!;
  const matches = findServices(step.service, origin.center, language, stepFree);
  const active =
    matches.find(({ facility }) => facility.id === selectedId) ?? matches[0];

  return (
    <div className="atlas-columns">
      <aside className="atlas-controls" aria-label="Personal journey controls">
        <div>
          <p className="atlas-kicker">Personal mode</p>
          <h2>Sketch your care journey</h2>
          <p>
            Choose a fictional situation and see which services fit each step.
          </p>
        </div>
        <label className="atlas-field">
          Demo situation
          <select
            value={journeyIndex}
            onChange={(event) => {
              setJourney(Number(event.target.value));
              setStep(0);
              setSelected(undefined);
            }}
          >
            {journeys.map((item, index) => (
              <option key={item.id} value={index}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <ol className="atlas-journey">
          {journey.steps.map((item, index) => (
            <li key={item.service}>
              <button
                type="button"
                aria-current={stepIndex === index ? "step" : undefined}
                onClick={() => {
                  setStep(index);
                  setSelected(undefined);
                }}
              >
                <span className="atlas-step-index" aria-hidden="true">
                  {index + 1}
                </span>
                {services[item.service].name}
              </button>
            </li>
          ))}
        </ol>
        <div className="atlas-prep" aria-live="polite">
          <h3>Prepare for this step</h3>
          <p>{step.prompt}</p>
        </div>
        <label className="atlas-field">
          Starting district
          <select
            value={originId}
            onChange={(event) => {
              setOrigin(event.target.value as DistrictId);
              setSelected(undefined);
            }}
          >
            {districts.map((district) => (
              <option value={district.id} key={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </label>
        <label className="atlas-field">
          Service language
          <select
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value as Language | "");
              setSelected(undefined);
            }}
          >
            <option value="">Any language</option>
            {languages.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="atlas-checkbox">
          <input
            checked={stepFree}
            onChange={(event) => {
              setStepFree(event.target.checked);
              setSelected(undefined);
            }}
            type="checkbox"
          />{" "}
          Step-free entry
        </label>
        <Link href="/learn/options">
          Explore counselling questions in Learn →
        </Link>
      </aside>
      <section className="atlas-card" aria-label="Personal services">
        <div className="atlas-card-heading">
          <div>
            <p className="atlas-kicker">Journey map</p>
            <h2>{services[step.service].name}</h2>
          </div>
          <span className="atlas-counter" role="status">
            {matches.length} {matches.length === 1 ? "service" : "services"}
          </span>
        </div>
        <AtlasMap
          visible={matches.map(({ facility }) => facility)}
          selected={active?.facility.id}
          select={setSelected}
          origin={origin.center}
          pinServices={[step.service]}
        />
        <div className="atlas-map-key">
          <span>◎ Starting district</span>
          <span>┄ Straight-line distance</span>
        </div>
        {matches.length > 0 ? (
          <>
            <label className="atlas-field atlas-site-control">
              Matching facility
              <select
                value={active?.facility.id}
                onChange={(event) => setSelected(event.target.value)}
              >
                {matches.map(({ facility, distance }) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name} · {distance.toFixed(1)} km
                  </option>
                ))}
              </select>
            </label>
            {active && (
              <FacilityDetails
                facility={active.facility}
                distance={active.distance}
              />
            )}
          </>
        ) : (
          <p className="atlas-empty" role="status">
            No fictional facility matches these filters. Try another language or
            journey step.
          </p>
        )}
      </section>
    </div>
  );
}

function EcosystemMode() {
  const [enabled, setEnabled] = useState<Service[]>(serviceKeys);
  const [network, setNetwork] = useState(true);
  const [selection, setSelection] = useState<string>();
  const visible = facilities.filter((facility) =>
    facility.services.some((service) => enabled.includes(service)),
  );
  const active =
    visible.find((facility) => facility.id === selection) ?? visible[0];
  const links = referrals.filter(
    (edge) =>
      visible.some((facility) => facility.id === edge.from) &&
      visible.some((facility) => facility.id === edge.to),
  );
  return (
    <div className="atlas-columns">
      <aside className="atlas-controls" aria-label="Ecosystem filters">
        <div>
          <p className="atlas-kicker">Ecosystem mode</p>
          <h2>See how services connect</h2>
          <p>
            Filter the service layers, then select a facility to see its place
            in the fictional referral network.
          </p>
        </div>
        <fieldset className="atlas-layers">
          <legend>Service layers</legend>
          {serviceKeys.map((service) => (
            <label key={service} className="atlas-checkbox">
              <input
                type="checkbox"
                checked={enabled.includes(service)}
                onChange={(event) =>
                  setEnabled((current) =>
                    event.target.checked
                      ? [...current, service]
                      : current.filter((value) => value !== service),
                  )
                }
              />
              <span
                className="atlas-layer-icon"
                style={{ background: services[service].color }}
                aria-hidden="true"
              >
                {services[service].symbol}
              </span>
              {services[service].name}
            </label>
          ))}
        </fieldset>
        <label className="atlas-checkbox">
          <input
            type="checkbox"
            checked={network}
            onChange={(event) => setNetwork(event.target.checked)}
          />{" "}
          Show referral pathways
        </label>
        {network && (
          <details className="atlas-referrals">
            <summary>Visible referrals ({links.length})</summary>
            {links.length ? (
              <ul>
                {links.map((edge) => (
                  <li key={edge.from + edge.to}>
                    <strong>
                      {facilities.find((site) => site.id === edge.from)?.name} →{" "}
                      {facilities.find((site) => site.id === edge.to)?.name}
                    </strong>
                    <span>{edge.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No visible referral pathways.</p>
            )}
          </details>
        )}
      </aside>
      <section className="atlas-card" aria-label="Ecosystem facilities">
        <div className="atlas-card-heading">
          <div>
            <p className="atlas-kicker">Ecosystem map</p>
            <h2>Service network</h2>
          </div>
          <span className="atlas-counter" role="status">
            {visible.length} {visible.length === 1 ? "facility" : "facilities"}
          </span>
        </div>
        <AtlasMap
          visible={visible}
          selected={active?.id}
          select={setSelection}
          network={network}
          pinServices={enabled}
        />
        <div className="atlas-map-key">
          <span>Letter pins represent service categories</span>
          {network && <span>⇢ Fictional referral pathway</span>}
        </div>
        {active ? (
          <>
            <label className="atlas-field atlas-site-control">
              Visible facility
              <select
                value={active.id}
                onChange={(event) => setSelection(event.target.value)}
              >
                {visible.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </label>
            <FacilityDetails facility={active} />
          </>
        ) : (
          <p className="atlas-empty" role="status">
            Turn on a service layer to show facilities.
          </p>
        )}
      </section>
    </div>
  );
}

export function CareAtlas() {
  const [mode, setMode] = useState<Mode>("personal");
  return (
    <div className="care-atlas">
      <header className="atlas-header">
        <Link href="/" className="atlas-brand">
          <span aria-hidden="true">✳</span> AMAN GENOME
        </Link>
        <nav aria-label="Site navigation">
          <Link href="/">Home</Link>
          <Link href="/learn">Learn</Link>
          <Link href="/workspace">Workspace</Link>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="atlas-main">
        <div className="atlas-intro">
          <div>
            <p className="atlas-kicker">
              Synthetic demonstration · Not for clinical use
            </p>
            <h1>Care Atlas</h1>
            <p>
              Explore a genetic care journey, see how services connect, and test
              where a new service could improve access.
            </p>
          </div>
        </div>
        <div className="atlas-modes" role="group" aria-label="Atlas mode">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === mode}
              onClick={() => setMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {mode === "personal" ? (
          <PersonalMode />
        ) : mode === "ecosystem" ? (
          <EcosystemMode />
        ) : (
          <PolicyMode />
        )}
        <footer className="atlas-footer">
          <span>
            All locations, facilities and population figures are fictional.
          </span>
          <span>Selections stay in this open view.</span>
        </footer>
      </main>
    </div>
  );
}
