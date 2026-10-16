import Brand from '@/shared/components/brand';
import Button from '@/shared/components/button';
import { cn } from '@/shared/lib/cn';
import { LinkBreak } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';

// nodes left dangling on the canvas, each with an edge that leads nowhere; positions in percent
const STRAYS = [
  { label: 'Decision · D-404', detail: 'No sources found', x: 16, y: 28, edge: 'right' },
  { label: '/this-page', detail: 'Moved or never existed', x: 82, y: 72, edge: 'left' },
] as const;

/** The 404 page: the logo mark as the zero, orbiting, among nodes whose edges lead nowhere. */
export default function NotFound() {
  return (
    <main className="relative -mx-4 -my-2 flex min-h-svh flex-col overflow-hidden bg-dot-grid px-6 py-6 md:px-10">
      <Brand className="relative z-10" />
      {STRAYS.map((stray) => {
        return (
          <div
            key={stray.label}
            aria-hidden
            className={cn(
              'absolute hidden -translate-1/2 items-center lg:flex',
              stray.edge === 'left' && 'flex-row-reverse',
            )}
            style={{ left: `${stray.x}%`, top: `${stray.y}%` }}
          >
            <div className="flex flex-col whitespace-nowrap rounded-xl border border-border bg-surface px-3 py-2 shadow-sm">
              <span className="font-mono text-xs font-medium">{stray.label}</span>
              <span className="text-xs text-muted">{stray.detail}</span>
            </div>
            <DanglingEdge side={stray.edge} />
          </div>
        );
      })}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center">
        <p
          aria-label="404"
          className="flex items-center text-8xl leading-none font-bold tracking-tighter md:text-9xl"
        >
          <span aria-hidden>4</span>
          <Image
            src="/logo.svg"
            alt=""
            aria-hidden
            width={128}
            height={128}
            className="mx-2 size-[0.8em] motion-safe:animate-orbit"
          />
          <span aria-hidden>4</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Lost your bearings?</h1>
        <p className="max-w-md text-balance text-muted">
          This page moved, or never existed. Everything you were looking for is still back home.
        </p>
        <Button asChild variant="primary" size="lg" className="px-8">
          <Link href="/">Take me home</Link>
        </Button>
      </div>
    </main>
  );
}

function DanglingEdge({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={cn('flex items-center', side === 'left' && 'flex-row-reverse')}>
      <span className="w-24 border-t-2 border-dashed border-border-strong" />
      <LinkBreak className="size-4 text-muted" />
    </div>
  );
}
