// the logo's idea at a larger scale: a decision at the centre, its sources orbiting on rings
const CENTRE = { x: 500, y: 590 };
const RINGS = [80, 140, 200];
const MOONS = [
  { ring: 0, angle: 200, r: 14, className: 'fill-accent-amber' },
  { ring: 1, angle: 245, r: 18, className: 'fill-primary/70' },
  { ring: 1, angle: 160, r: 9, className: 'fill-accent-purple' },
  { ring: 2, angle: 215, r: 12, className: 'fill-accent-orange' },
  { ring: 2, angle: 275, r: 8, className: 'fill-success' },
  { ring: 2, angle: 150, r: 16, className: 'fill-accent-blue/40' },
] as const;

function onRing(ring: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    cx: CENTRE.x + RINGS[ring] * Math.cos(radians),
    cy: CENTRE.y + RINGS[ring] * Math.sin(radians),
  };
}

/** Decorative: sources orbiting one decision, rising out of the bottom corner of the waitlist pitch. */
export default function WaitlistArt() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 640"
      preserveAspectRatio="xMaxYMax slice"
      className="absolute inset-0 size-full"
    >
      {/* soft shapes drifting in the background */}
      <rect
        x="380"
        y="40"
        width="200"
        height="80"
        rx="40"
        transform="rotate(-18 480 80)"
        className="fill-accent-amber/15"
      />
      <circle cx="40" cy="640" r="150" className="fill-primary/10" />
      {RINGS.map((radius, i) => {
        return (
          <circle
            key={radius}
            cx={CENTRE.x}
            cy={CENTRE.y}
            r={radius}
            strokeWidth={1.5}
            strokeDasharray={i === 1 ? '6 8' : undefined}
            className="fill-none stroke-border-strong"
          />
        );
      })}
      <g
        className="motion-safe:animate-orbit"
        style={{ transformOrigin: `${CENTRE.x}px ${CENTRE.y}px` }}
      >
        {MOONS.map((moon) => {
          return (
            <circle
              key={`${moon.ring}-${moon.angle}`}
              {...onRing(moon.ring, moon.angle)}
              r={moon.r}
              className={moon.className}
            />
          );
        })}
      </g>
      <circle cx={CENTRE.x} cy={CENTRE.y} r="44" className="fill-primary" />
      <circle
        cx={CENTRE.x}
        cy={CENTRE.y}
        r="44"
        strokeWidth="10"
        className="fill-none stroke-primary/20"
      />
      <circle cx={CENTRE.x - 14} cy={CENTRE.y - 14} r="10" className="fill-surface/30" />
    </svg>
  );
}
