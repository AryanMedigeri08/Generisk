import { useState } from "react";
import {
  districts,
  facilities,
  serviceKeys,
  services,
  simulateAccess,
  supportsRemote,
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
  if (area.remoteReached) return "Partial telehealth reach";
  return "Access gap";
}

export function PolicyMode() {
  const [service, setService] = useState<Service>("counselling");
  const [radius, setRadius] = useState(7);
  const [proposals, setProposals] = useState<Point[]>([]);
  const [activeProposal, setActiveProposal] = useState(0);
  const [roadEstimate, setRoadEstimate] = useState(false);
  const [telehealth, setTelehealth] = useState(false);
  const [maxWaitDays, setMaxWaitDays] = useState<number>();
  const [districtId, setDistrict] = useState("south");
  const [selected, setSelected] = useState<string>();
  const access = simulateAccess(service, radius, proposals, {
    roadEstimate,
    telehealth,
    maxWaitDays,
  });
  const hasScenario =
    proposals.length > 0 || (telehealth && supportsRemote(service));
  const existing = facilities.filter((site) => site.services.includes(service));
  const activeFacility = existing.find((site) => site.id === selected);
  const gaps = access.areas
    .filter((area) => !area.coveredAfter)
    .sort((a, b) => b.population - a.population);
  const gain = access.reached[1] - access.reached[0];

  function move(index: number, point: Point) {
    setProposals((current) =>
      current.length
        ? current.map((previous, i) => (i === index ? point : previous))
        : [point],
    );
  }

  function selectedCentre() {
    return districts.find((district) => district.id === districtId)!.center;
  }

  return (
    <div className="atlas-columns">
      <aside className="atlas-controls" aria-label="Policy simulation controls">
        <div>
          <p className="atlas-kicker">Policy mode</p>
          <h2>Test a service expansion</h2>
          <p>
            Compare proposed sites or virtual access against the fictional
            baseline.
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
        <label className="atlas-checkbox">
          <input
            type="checkbox"
            checked={roadEstimate}
            onChange={(event) => setRoadEstimate(event.target.checked)}
          />{" "}
          Apply illustrative road detour (1.35×)
        </label>
        <label className="atlas-field">
          Simulated waiting-time limit
          <select
            value={maxWaitDays ?? ""}
            onChange={(event) =>
              setMaxWaitDays(
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
          >
            <option value="">Any modeled wait</option>
            {[5, 10, 15].map((days) => (
              <option key={days} value={days}>
                {days} days
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
          onClick={() => move(activeProposal, selectedCentre())}
        >
          Place proposed site
        </button>
        {proposals.length > 0 && (
          <>
            <label className="atlas-field">
              Active site
              <select
                value={activeProposal}
                onChange={(event) =>
                  setActiveProposal(Number(event.target.value))
                }
              >
                {proposals.map((_, index) => (
                  <option key={index} value={index}>
                    Site {index + 1}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="atlas-secondary"
              disabled={proposals.length >= 4}
              onClick={() => {
                setActiveProposal(proposals.length);
                setProposals((current) => [...current, selectedCentre()]);
              }}
            >
              Add another site
            </button>
            <button
              type="button"
              className="atlas-secondary"
              onClick={() => {
                setProposals((current) =>
                  current.filter((_, index) => index !== activeProposal),
                );
                setActiveProposal(0);
              }}
            >
              Remove active site
            </button>
          </>
        )}
        {supportsRemote(service) && (
          <label className="atlas-checkbox">
            <input
              type="checkbox"
              checked={telehealth}
              onChange={(event) => setTelehealth(event.target.checked)}
            />{" "}
            Expand simulated telehealth
          </label>
        )}
        <button
          type="button"
          className="atlas-secondary"
          disabled={!hasScenario}
          onClick={() => {
            setProposals([]);
            setActiveProposal(0);
            setTelehealth(false);
          }}
        >
          Reset to baseline
        </button>
        <div className="atlas-prep">
          <h3>How coverage is estimated</h3>
          <p>
            Each district’s fictional population is counted within reach if its
            centre is inside the selected distance and waiting-time limits.
            Telehealth assumes 60% reach in districts outside in-person
            coverage. Mean distance uses physical sites and district
            populations.
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
            {hasScenario ? "Proposal active" : "Baseline"}
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
          <div>
            <span>Simulated monthly slots</span>
            <strong>
              {formatPopulation.format(access.appointmentCapacity[1])}
            </strong>
            <small>
              Baseline {formatPopulation.format(access.appointmentCapacity[0])}
            </small>
          </div>
        </div>
        <AtlasMap
          visible={existing}
          selected={activeFacility?.id}
          select={setSelected}
          access={access}
          radius={roadEstimate ? radius / 1.35 : radius}
          proposals={proposals}
          moveProposal={move}
          place={(point) => move(activeProposal, point)}
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
          Click the map to move the active site, drag a site marker, or use the
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
              fictional residents outside modeled reach.
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
          Road distance, waiting times and monthly slots are scenario
          assumptions. Slot counts are shown separately from geographical reach.
        </p>
      </section>
    </div>
  );
}
