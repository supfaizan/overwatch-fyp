import GithubMark from '@/shared/components/github-mark';
import Image from 'next/image';
import { ARC_VIEW, ARCS, type Integration, INTEGRATION_SIZE, INTEGRATIONS } from '../constants';
import { arcPath, pointOnArc } from '../lib';

function percent(value: number, of: number) {
  return `${(value / of) * 100}%`;
}

function Logo({ integration, className }: { integration: Integration; className: string }) {
  return integration.src
    ? (
      <Image
        src={integration.src}
        alt={integration.name}
        width={INTEGRATION_SIZE * 2}
        height={INTEGRATION_SIZE * 2}
        className={className}
      />
    )
    : (
      <GithubMark
        role="img"
        aria-label={integration.name}
        aria-hidden={false}
        className={className}
      />
    );
}

/** The tools the product reads from, orbiting down onto the app preview. Fills its parent, which sets the aspect ratio. */
export function IntegrationArcs() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block">
      <svg
        viewBox={`0 0 ${ARC_VIEW.width} ${ARC_VIEW.height}`}
        aria-hidden
        className="absolute inset-0 size-full"
      >
        {Object.values(ARCS).map((arc) => {
          return (
            <path
              key={arcPath(arc)}
              d={arcPath(arc)}
              className="fill-none stroke-border-strong"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
      <ul aria-label="Works with">
        {INTEGRATIONS.map((integration) => {
          const [x, y] = pointOnArc(ARCS[integration.arc], integration.at);
          return (
            <li
              key={integration.name}
              className="absolute -translate-1/2"
              style={{
                left: percent(x, ARC_VIEW.width),
                top: percent(y, ARC_VIEW.height),
                width: percent(INTEGRATION_SIZE, ARC_VIEW.width),
              }}
            >
              <Logo integration={integration} className="h-auto w-full object-contain" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The same tools as a small row, for screens too narrow for the arcs. */
export function IntegrationRow() {
  return (
    <div className="flex flex-col items-center gap-3 md:hidden">
      <p className="text-xs text-muted">Works with</p>
      <ul className="flex flex-wrap justify-center gap-3">
        {INTEGRATIONS.map((integration) => {
          return (
            <li key={integration.name}>
              <Logo integration={integration} className="size-6 object-contain" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
