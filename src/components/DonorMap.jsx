/* Stylized SVG map of central Dhaka for the /find screen.
   Positions are illustrative, not geographic. Google Maps integration
   plugs in at the same slot when an API key is available. */

const COORDS = {
  'bl-1042': { x: 425, y: 185 },
  'bl-0987': { x: 245, y: 330 },
  'bl-0231': { x: 380, y: 268 },
  'bl-0319': { x: 330, y: 372 },
  'bl-1154': { x: 300, y: 148 },
  'bl-0764': { x: 455, y: 66 },
  'bl-0508': { x: 252, y: 292 },
  'bl-0411': { x: 214, y: 244 },
  'bl-0296': { x: 68, y: 322 },
  'bl-0873': { x: 205, y: 158 },
}

const YOU = { x: 276, y: 232 }

export default function DonorMap({ donors, selectedId, onSelect }) {
  const selected = donors.find((d) => d.id === selectedId)
  const sel = selected ? COORDS[selected.id] : null

  return (
    <svg
      viewBox="0 0 560 420"
      role="img"
      aria-label="Map of donors near Dhanmondi"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* base */}
      <rect x="0" y="0" width="560" height="420" fill="var(--raised-2)" />

      {/* river: the Buriganga to the south */}
      <path d="M0 0 H96 C 120 90, 78 170, 104 250 C 126 322, 92 380, 112 420 H0 Z" fill="rgba(96, 165, 250, 0.16)" />
      <path d="M96 0 C 120 90, 78 170, 104 250 C 126 322, 92 380, 112 420" stroke="rgba(96, 165, 250, 0.35)" strokeWidth="1.5" fill="none" />

      {/* arterial roads */}
      <g stroke="var(--faint)" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" opacity="0.55">
        <path d="M120 420 L 268 210 L 560 120" fill="none" />
        <path d="M250 420 L 316 214 L 420 0" fill="none" />
        <path d="M110 330 L 380 268 L 560 260" fill="none" />
      </g>
      {/* minor streets */}
      <g stroke="var(--line)" strokeWidth="2">
        <path d="M150 160 H560" />
        <path d="M150 240 H560" />
        <path d="M170 320 H560" />
        <path d="M210 96 L 250 420" />
        <path d="M330 60 L 300 190" />
        <path d="M420 160 L 460 420" />
      </g>

      {/* park blocks */}
      <rect x="330" y="180" width="46" height="26" rx="6" fill="var(--good-soft)" />
      <rect x="150" y="282" width="34" height="22" rx="6" fill="var(--good-soft)" />

      {/* search radius around you */}
      <circle cx={YOU.x} cy={YOU.y} r="120" fill="var(--brand-soft)" stroke="var(--brand)" strokeOpacity="0.35" strokeDasharray="5 6" />

      {/* dashed line to selected donor */}
      {sel && (
        <line
          x1={YOU.x}
          y1={YOU.y}
          x2={sel.x}
          y2={sel.y}
          stroke="var(--brand)"
          strokeWidth="2"
          strokeDasharray="6 6"
          strokeOpacity="0.9"
        />
      )}

      {/* you marker */}
      <g transform={`translate(${YOU.x} ${YOU.y})`}>
        <circle r="17" fill="var(--brand-soft)" className="map-pulse" />
        <circle r="9" fill="var(--brand-solid)" stroke="var(--bg)" strokeWidth="3" />
      </g>

      {/* donor pins */}
      {donors.map((d) => {
        const c = COORDS[d.id]
        if (!c) return null
        const isSel = d.id === selectedId
        const fill = !d.available ? 'var(--faint)' : isSel ? 'var(--brand-solid)' : 'var(--brand)'
        return (
          <g
            key={d.id}
            transform={`translate(${c.x} ${c.y})`}
            onClick={() => onSelect(d.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(d.id)
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Donor ${d.name}, group ${d.group}, ${d.km} km away${d.available ? '' : ', currently unavailable'}`}
            className="cursor-pointer focus:outline-none"
          >
            <circle r={isSel ? 15 : 11} fill={fill} fillOpacity={d.available ? 0.22 : 0.14} />
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

      {/* zoom controls (decorative, disabled state) */}
      <g aria-hidden="true" opacity="0.9">
        <rect x="500" y="330" width="36" height="36" rx="10" fill="var(--raised)" stroke="var(--line)" />
        <path d="M510 348h16" stroke="var(--mute)" strokeWidth="2" strokeLinecap="round" />
        <rect x="500" y="376" width="36" height="36" rx="10" fill="var(--raised)" stroke="var(--line)" />
        <path d="M510 394h16" stroke="var(--mute)" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* legend */}
      <g transform="translate(16 14)" fontFamily="'Geist Variable', sans-serif" fontSize="11" fill="var(--mute)">
        <rect x="-8" y="-11" width="158" height="25" rx="7" fill="var(--raised)" fillOpacity="0.85" stroke="var(--line)" />
        <circle cx="4" cy="1.5" r="4" fill="var(--brand-solid)" />
        <text x="14" y="5">Available donor</text>
      </g>
    </svg>
  )
}
