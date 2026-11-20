import { useState } from "react";
import {
  districts,
  facilities,
  serviceKeys,
  services,
  simulateAccess,
  type Point,
  type Service,
} from "../../lib/care-atlas";
import { AtlasMap } from "./atlas-map";

const formatPopulation = new Intl.NumberFormat("en");
const formatCoverage = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 1,
});

function accessState(area: ReturnType<typeof simulateAccess>["areas"][number]) {
  if (area.coveredBefore) return "Within reach";
  if (area.coveredAfter) return "Newly within reach";
  return "Access gap";
}

export function PolicyMode() {
  const [service, setService] = useState<Service>("counselling");
  const [radius, setRadius] = useState(7);
  const [proposal, setProposal] = useState<Point>();
  const [districtId, setDistrict] = useState("south");
  const [selected, setSelected] = useState<string>();
  const access = simulateAccess(service, radius, proposal);
  const existing = facilities.filter((site) => site.services.includes(service));
  const activeFacility = existing.find((site) => site.id === selected);
  const gaps = access.areas
    .filter((area) => !area.coveredAfter)
    .sort((a, b) => b.population - a.population);
  const gain = access.reached[1] - access.reached[0];

  return (
    <div className="atlas-columns">
      <aside className="atlas-controls" aria-label="Policy simulation controls">
        <div>
          <p className="atlas-kicker">Policy mode</p>
          <h2>Test a service expansion</h2>
          <p>
            Place a hypothetical site and compare who is within reach before and
            after it opens.
          </p>
        </div>
        <label className="atlas-field">
          Service to model
          <select
            value={service}
            onChange={(event) => {
              setService(event.target.value as Service);
              setSelected(undefined);
            }}
          >
            {serviceKeys.map((key) => (
              <option key={key} value={key}>
                {services[key].name}
              </option>
            ))}
          </select>
        </label>
        <label className="atlas-field">
          Service radius
          <select
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
          >
            {[3, 5, 7, 10, 15].map((km) => (
              <option value={km} key={km}>
                {km} km
              </option>
            ))}
          </select>
        </label>
        <label className="atlas-field">
          Proposed district
          <select
            value={districtId}
            onChange={(event) => setDistrict(event.target.value)}
          >
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="atlas-primary"
          onClick={() =>
            setProposal(
              districts.find((district) => district.id === districtId)?.center,
            )
          }
        >
          Place proposed site
        </button>
        <button
          type="button"
          className="atlas-secondary"
          disabled={!proposal}
          onClick={() => setProposal(undefined)}
        >
          Reset to baseline
        </button>
        <div className="atlas-prep">
          <h3>How coverage is estimated</h3>
          <p>
            Each district’s fictional population is counted within reach if its
            centre is inside the selected straight-line radius of a facility.
            Distances are weighted by district population.
          </p>
        </div>
      </aside>
      <section className="atlas-card" aria-label="Policy results">
        <div className="atlas-card-heading">
          <div>
            <p className="atlas-kicker">Access map</p>
            <h2>{services[service].name} coverage</h2>
          </div>
          <span className="atlas-counter">
            {proposal ? "Proposal active" : "Baseline"}
          </span>
        </div>
        <div
          className="atlas-metrics"
          aria-label="Coverage comparison"
          aria-live="polite"
        >
          <div>
            <span>Baseline coverage</span>
            <strong>{formatCoverage.format(access.coverage[0])}</strong>
            <small>
              {formatPopulation.format(access.reached[0])} of{" "}
              {formatPopulation.format(access.totalPopulation)} residents
            </small>
          </div>
          <div>
            <span>Scenario coverage</span>
            <strong>{formatCoverage.format(access.coverage[1])}</strong>
            <small>
              {gain > 0 ? "+" : ""}
              {formatPopulation.format(gain)} residents within reach
            </small>
          </div>
          <div>
            <span>Mean distance</span>
            <strong>{access.meanDistance[1].toFixed(1)} km</strong>
            <small>Baseline {access.meanDistance[0].toFixed(1)} km</small>
          </div>
        </div>
        <AtlasMap
          visible={existing}
          selected={activeFacility?.id}
          select={setSelected}
          access={access}
          radius={radius}
          proposal={proposal}
          place={setProposal}
          pinServices={[service]}
        />
        <div className="atlas-map-key">
          <span>
            <i className="atlas-swatch atlas-covered" /> Within reach
          </span>
          <span>
            <i className="atlas-swatch atlas-improved" /> Newly within reach
          </span>
          <span>
            <i className="atlas-swatch atlas-gap" /> Access gap
          </span>
          <span>+ Proposed site</span>
        </div>
        <p className="atlas-map-hint">
          Select a point on the map’s interior to move the proposal, or use the
          district selector.{" "}
          {activeFacility && (
            <>Existing site selected: {activeFacility.name}.</>
          )}
        </p>
        <div className="atlas-gaps" aria-live="polite">
          <h3>Remaining geographical gaps</h3>
          {gaps.length ? (
            <p>
              {gaps.map((area) => area.name).join(", ")} ·{" "}
              {formatPopulation.format(
                access.totalPopulation - access.reached[1],
              )}{" "}
              fictional residents outside the radius.
            </p>
          ) : (
            <p>
              Every fictional district centre is within the selected radius.
            </p>
          )}
        </div>
        <div
          className="atlas-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Scrollable district access comparison"
        >
          <table>
            <caption>District access comparison</caption>
            <thead>
              <tr>
                <th scope="col">District</th>
                <th scope="col">Population</th>
                <th scope="col">Baseline</th>
                <th scope="col">Scenario</th>
                <th scope="col">Access</th>
              </tr>
            </thead>
            <tbody>
              {access.areas.map((area) => (
                <tr key={area.id}>
                  <th scope="row">{area.name}</th>
                  <td>{formatPopulation.format(area.population)}</td>
                  <td>{area.before.toFixed(1)} km</td>
                  <td>{area.after.toFixed(1)} km</td>
                  <td>{accessState(area)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="atlas-map-hint">
          The model excludes road travel, waiting times, capacity and
          eligibility.
        </p>
      </section>
    </div>
  );
}
