import {
  districts,
  facilities,
  landOutline,
  mapSize,
  pointOnLand,
  referrals,
  services,
  unitsPerKm,
  type Point,
  type Service,
  type simulateAccess,
} from "../../lib/care-atlas";

type Facilities = typeof facilities;
type Access = ReturnType<typeof simulateAccess>;

const streets = [
  "M-10 274C150 234 219 259 329 221S542 238 770 196",
  "M-10 397C138 337 189 349 304 305S521 308 770 289",
  "M7 478C208 416 323 458 418 416S638 391 770 402",
  "M187 117C202 221 165 310 110 500",
  "M318 40C330 167 286 271 260 500",
  "M445 39C480 161 430 264 467 500",
  "M580 37C611 157 554 259 539 500",
  "M708 28C710 158 642 298 687 500",
  "M0 333C160 280 244 328 376 265S630 227 760 257",
  "M43 204C138 189 173 233 279 188S515 177 760 134",
  "M0 442C145 401 251 388 372 377S628 334 760 349",
];

function position(point: Point) {
  return {
    left: percent(point.x / mapSize.width),
    top: percent(point.y / mapSize.height),
  };
}

function percent(ratio: number) {
  return ratio * 100 + "%";
}

export function AtlasMap({
  visible,
  selected,
  select,
  network = false,
  origin,
  access,
  radius,
  proposal,
  place,
  pinServices,
}: {
  visible: Facilities;
  selected: string | undefined;
  select: (id: string) => void;
  network?: boolean;
  origin?: Point;
  access?: Access;
  radius?: number;
  proposal?: Point;
  place?: (point: Point) => void;
  pinServices?: readonly Service[];
}) {
  const active = visible.find((site) => site.id === selected);
  const connections = network
    ? referrals.flatMap((edge) => {
        const from = visible.find((site) => site.id === edge.from);
        const to = visible.find((site) => site.id === edge.to);
        return from && to ? [{ ...edge, from: from.point, to: to.point }] : [];
      })
    : [];

  return (
    <div className="atlas-map-frame">
      <div
        className="atlas-map-scroll"
        tabIndex={0}
        role="region"
        aria-label="Scrollable atlas map"
      >
        <div className="atlas-map">
          <svg
            className="atlas-cartography"
            viewBox="0 0 760 500"
            aria-hidden="true"
            onClick={
              place
                ? (event) => {
                    const bounds = event.currentTarget.getBoundingClientRect();
                    const point = {
                      x:
                        ((event.clientX - bounds.left) * mapSize.width) /
                        bounds.width,
                      y:
                        ((event.clientY - bounds.top) * mapSize.height) /
                        bounds.height,
                    };
                    if (pointOnLand(point)) place(point);
                  }
                : undefined
            }
            data-placing={Boolean(place)}
          >
            <defs>
              <pattern
                id="atlas-water"
                width="18"
                height="18"
                patternUnits="userSpaceOnUse"
              >
                <rect width="18" height="18" fill="#d7e8e6" />
                <circle cx="2" cy="2" r="0.7" fill="#9bbeba" />
              </pattern>
              <clipPath id="atlas-land">
                <path d={landOutline} />
              </clipPath>
              <marker
                id="atlas-arrow"
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="4"
                markerHeight="4"
                orient="auto"
              >
                <path d="M0 0L8 4L0 8Z" fill="#286760" />
              </marker>
            </defs>
            <rect width="760" height="500" fill="url(#atlas-water)" />
            <path
              d="M20 113 70 86 113 92 137 112 108 125 69 126 48 142Z M147 54 179 41 220 49 242 68 200 83 167 79Z"
              fill="#eeeee1"
            />
            <g clipPath="url(#atlas-land)">
              <rect width="760" height="500" fill="#f2efe4" />
              {districts.map((district, index) => {
                const area = access?.areas[index];
                const shade = area
                  ? area.coveredBefore
                    ? "#d6e8d7"
                    : area.coveredAfter
                      ? "#a9d9c6"
                      : "#f0dec5"
                  : index % 2 === 1
                    ? "#e8ebdf"
                    : "#efeddf";
                return (
                  <polygon
                    key={district.id}
                    points={district.boundary}
                    fill={shade}
                    stroke="#a4ada0"
                    strokeDasharray="4 6"
                  />
                );
              })}
              {streets.map((path, index) => (
                <path
                  key={path}
                  d={path}
                  fill="none"
                  stroke={index < 3 ? "#fffefa" : "#fbfaf3"}
                  strokeWidth={index < 3 ? 5 : 2}
                />
              ))}
              {proposal && radius !== undefined && (
                <circle
                  cx={proposal.x}
                  cy={proposal.y}
                  r={radius * unitsPerKm}
                  fill="#2e8c7416"
                  stroke="#0e6757"
                  strokeWidth="2"
                  strokeDasharray="5 6"
                />
              )}
            </g>
            <path
              d={landOutline}
              fill="none"
              stroke="#9bbeba"
              strokeWidth="2"
            />
            {connections.map((edge) => {
              const dx = edge.to.x - edge.from.x;
              const dy = edge.to.y - edge.from.y;
              return (
                <path
                  key={edge.label + edge.from.x + edge.to.x}
                  d={
                    "M" +
                    edge.from.x +
                    " " +
                    edge.from.y +
                    " Q" +
                    (edge.from.x + dx * 0.42 - dy * 0.14) +
                    " " +
                    (edge.from.y + dy * 0.42 + dx * 0.14) +
                    " " +
                    (edge.from.x + dx * 0.86) +
                    " " +
                    (edge.from.y + dy * 0.86)
                  }
                  fill="none"
                  stroke="#286760"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  markerEnd="url(#atlas-arrow)"
                />
              );
            })}
            {origin && active && (
              <path
                d={
                  "M" +
                  origin.x +
                  " " +
                  origin.y +
                  "L" +
                  active.point.x +
                  " " +
                  active.point.y
                }
                stroke="#064c44"
                strokeWidth="3"
                strokeDasharray="4 6"
              />
            )}
            {districts.map((district) => (
              <text
                key={district.id}
                x={district.center.x}
                y={district.center.y + 25}
                textAnchor="middle"
                className="atlas-map-label"
              >
                {district.name}
              </text>
            ))}
            <text x="32" y="49" className="atlas-water-label">
              FICTIONAL COAST
            </text>
            <path
              d="M705 92v-24l-5 8m5-8 5 8M670 454h60m-60-4v8m60-8v8"
              fill="none"
              stroke="#314b4a"
              strokeWidth="2"
            />
            <text
              x="705"
              y="65"
              textAnchor="middle"
              className="atlas-map-label"
            >
              N
            </text>
            <text
              x="700"
              y="474"
              textAnchor="middle"
              className="atlas-map-label"
            >
              3 km
            </text>
          </svg>
          {origin && (
            <span
              className="atlas-origin"
              style={position(origin)}
              aria-hidden="true"
            >
              ◎
            </span>
          )}
          {visible.map((facility) => {
            const category =
              facility.services.find((service) =>
                pinServices?.includes(service),
              ) ?? facility.services[0];
            const service = services[category];
            return (
              <button
                type="button"
                className="atlas-pin"
                key={facility.id}
                style={{
                  ...position(facility.point),
                  background: service.color,
                }}
                aria-label={facility.name}
                title={facility.name}
                aria-pressed={selected === facility.id}
                onClick={() => select(facility.id)}
              >
                {service.symbol}
              </button>
            );
          })}
          {proposal && (
            <span
              className="atlas-proposal"
              style={position(proposal)}
              aria-label="Proposed site"
              role="img"
            >
              +
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
