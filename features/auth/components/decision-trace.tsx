import GithubMark from '@/shared/components/github-mark';
import { INTEGRATION_LOGOS } from '@/shared/lib/integrations';
import { CheckCircle } from '@phosphor-icons/react/ssr';
import Image from 'next/image';

const DECISION = { x: 50, y: 52 };

// where each source sits, in percent of the panel; GitHub has no image and uses the shared mark
const SOURCES = [
  { name: 'Slack', src: INTEGRATION_LOGOS.slack, detail: '#architecture', x: 22, y: 17 },
  { name: 'Confluence', src: INTEGRATION_LOGOS.confluence, detail: 'ADR-007', x: 76, y: 14 },
  {
    name: 'Google Meet',
    src: INTEGRATION_LOGOS.googleMeet,
    detail: 'Design sync',
    x: 13,
    y: 48,
  },
  { name: 'GitHub', detail: 'PR #482', x: 87, y: 50 },
  { name: 'Jira', src: INTEGRATION_LOGOS.jira, detail: 'NW-216', x: 25, y: 84 },
  { name: 'Figma', src: INTEGRATION_LOGOS.figma, detail: 'Graph view v2', x: 76, y: 86 },
] as const;

const ICON_SIZE = 28;

/** Decorative: scattered sources flowing into one decision, on the app's canvas. */
export default function DecisionTrace() {
  return (
    <div
      aria-hidden
      className="relative size-full overflow-hidden rounded-3xl border border-border bg-primary/5 bg-dot-grid"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        {SOURCES.map((source) => {
          return (
            <path
              key={source.name}
              d={`M${source.x} ${source.y} Q${source.x} ${DECISION.y} ${DECISION.x} ${DECISION.y}`}
              pathLength={100}
              vectorEffect="non-scaling-stroke"
              strokeDasharray="4 6"
              strokeWidth={2}
              className="fill-none stroke-primary/60 motion-safe:animate-dash-flow"
            />
          );
        })}
      </svg>
      {SOURCES.map((source) => {
        return (
          <div
            key={source.name}
            className="absolute flex -translate-1/2 items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-surface py-2 pr-3 pl-2 shadow-sm"
            style={{ left: `${source.x}%`, top: `${source.y}%` }}
          >
            {'src' in source
              ? (
                <Image
                  src={source.src}
                  alt=""
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  className="size-7 object-contain"
                />
              )
              : <GithubMark className="size-7" />}
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-medium">{source.name}</span>
              <span className="text-xs text-muted">{source.detail}</span>
            </div>
          </div>
        );
      })}
      <div
        className="absolute flex w-64 -translate-1/2 flex-col gap-3 rounded-2xl border border-primary bg-surface p-4 shadow-lg"
        style={{ left: `${DECISION.x}%`, top: `${DECISION.y}%` }}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted">Decision · D-31</span>
          <span className="flex items-center gap-1 font-medium text-success">
            <CheckCircle weight="fill" className="size-3.5" />
            Decided
          </span>
        </div>
        <p className="font-semibold leading-snug">Keep the code graph in Neo4j</p>
        <div className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-primary" />
          Traced from {SOURCES.length} sources
        </div>
      </div>
    </div>
  );
}
