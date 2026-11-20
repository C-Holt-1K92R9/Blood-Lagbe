/* Stylised map for the /find screen. Distances and grouping are real; pin
   angles are illustrative so precise donor coordinates are never exposed.
   Swap this whole component for a tile map when a map key is available. */

const W = 560
const H = 420
const CX = 276
const CY = 210
const RADIUS_PX = 120 // one 10 km search radius

function angleFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return ((hash % 360) * Math.PI) / 180
}

export default function DonorMap({ donors = [], selectedId, onSelect }) {
  const points = donors.map((d) => {
    const angle = angleFor(String(d.id))
    const ratio = Math.min(Number(d.distanceKm || 0) / 10, 1.35)
    return {
      donor: d,
      x: CX + Math.cos(angle) * ratio * RADIUS_PX,
      y: CY + Math.sin(angle) * ratio * RADIUS_PX,
    }
  })

  const sel = points.find((p) => p.donor.id === selectedId)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={
        donors.length === 0
          ? 'Map placeholder, no donors searched yet'
          : `Map of ${donors.length} matching donors around your location`
      }
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect x="0" y="0" width={W} height={H} fill="var(--raised-2)" />

      {/* river: the Buriganga to the south */}
      <path d="M0 0 H96 C 120 90, 78 170, 104 250 C 126 322, 92 380, 112 420 H0 Z" fill="rgba(96, 165, 250, 0.16)" />
      <path
        d="M96 0 C 120 90, 78 170, 104 250 C 126 322, 92 380, 112 420"
        stroke="rgba(96, 165, 250, 0.35)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* arterial roads */}
      <g stroke="var(--faint)" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" opacity="0.55">
        <path d="M120 420 L 268 210 L 560 120" fill="none" />
        <path d="M250 420 L 316 214 L 420 0" fill="none" />
        <path d="M110 330 L 380 268 L 560 260" fill="none" />
      </g>
      <g stroke="var(--line)" strokeWidth="2">
        <path d="M150 160 H560" />
        <path d="M150 240 H560" />
        <path d="M170 320 H560" />
        <path d="M210 96 L 250 420" />
        <path d="M330 60 L 300 190" />
        <path d="M420 160 L 460 420" />
      </g>

      <rect x="330" y="180" width="46" height="26" rx="6" fill="var(--good-soft)" />
      <rect x="150" y="282" width="34" height="22" rx="6" fill="var(--good-soft)" />

      {/* 10 km search radius */}
      <circle
        cx={CX}
        cy={CY}
        r={RADIUS_PX}
        fill="var(--brand-soft)"
        stroke="var(--brand)"
        strokeOpacity="0.35"
        strokeDasharray="5 6"
      />
      <text x={CX + 6} y={CY - RADIUS_PX + 16} fontSize="10" fill="var(--mute)" fontFamily="'Geist Mono', monospace">
        10 km
      </text>

      {sel && (
        <line
          x1={CX}
          y1={CY}
          x2={sel.x}
          y2={sel.y}
          stroke="var(--brand)"
          strokeWidth="2"
          strokeDasharray="6 6"
          strokeOpacity="0.9"
        />
      )}

      {/* your position */}
      <g transform={`translate(${CX} ${CY})`}>
        <circle r="17" fill="var(--brand-soft)" className="map-pulse" />
        <circle r="9" fill="var(--brand-solid)" stroke="var(--bg)" strokeWidth="3" />
      </g>

      {points.map(({ donor, x, y }) => {
        const isSel = donor.id === selectedId
        const fill = donor.withinRadius ? 'var(--brand-solid)' : 'var(--mute)'
        return (
          <g
            key={donor.id}
            transform={`translate(${x} ${y})`}
            onClick={() => onSelect(donor.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(donor.id)
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`${donor.name}, ${donor.bloodGroup}, ${
              donor.withinRadius ? `${donor.distanceKm} km away` : 'elsewhere in the same city'
            }`}
            className="cursor-pointer focus:outline-none"
          >
            <circle r={isSel ? 15 : 11} fill={fill} fillOpacity="0.22" />
            <path
              d="M0 -7.5c-3.4 0-5.6 2.3-5.6 5.1 0 3.8 5.6 8.4 5.6 8.4s5.6-4.6 5.6-8.4C5.6-5.2 3.4-7.5 0-7.5z"
              fill={fill}
              stroke="var(--bg)"
              strokeWidth="1.6"
            />
            <circle r="1.7" cy="-2.4" fill="var(--bg)" opacity="0.9" />
          </g>
        )
      })}

      {/* legend */}
      <g transform="translate(16 14)" fontFamily="'Geist Variable', sans-serif" fontSize="11" fill="var(--mute)">
        <rect x="-8" y="-11" width="214" height="46" rx="7" fill="var(--raised)" fillOpacity="0.9" stroke="var(--line)" />
        <circle cx="4" cy="1.5" r="4" fill="var(--brand-solid)" />
        <text x="14" y="5">Within 10 km</text>
        <circle cx="4" cy="20" r="4" fill="var(--mute)" />
        <text x="14" y="24">Same city, further away</text>
      </g>
    </svg>
  )
}
