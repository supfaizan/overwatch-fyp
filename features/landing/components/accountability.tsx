import { PRODUCT_NAME } from '@/shared/lib/env';

/** The 1979 IBM line on accountability, and our answer to it, joined like two nodes on the canvas. */
export default function Accountability({ id }: { id: string }) {
  return (
    <section
      id={id}
      className="mx-auto flex max-w-4xl scroll-mt-8 flex-col items-center px-4 py-24 text-center md:py-32"
    >
      <figure className="flex flex-col items-center gap-6">
        <blockquote className="text-2xl font-medium tracking-tight text-balance text-muted md:text-4xl">
          <span aria-hidden className="text-primary">&ldquo;</span>
          A computer can never be held accountable, therefore a computer must never make a
          management decision.
          <span aria-hidden className="text-primary">&rdquo;</span>
        </blockquote>
        <figcaption className="text-xs font-medium tracking-widest text-muted uppercase">
          IBM, 1979
        </figcaption>
      </figure>
      {/* an edge on the canvas, from the quote to our answer */}
      <div aria-hidden className="flex flex-col items-center py-8">
        <span className="h-16 border-l-2 border-dashed border-border-strong" />
        <span className="size-3 rounded-full border-2 border-primary bg-surface" />
      </div>
      <p className="text-3xl font-semibold tracking-tight text-balance md:text-5xl">
        But it can help you reach one{' '}
        <span className="pr-1 text-primary italic underline decoration-primary/30 decoration-4 underline-offset-8">
          faster
        </span>.
      </p>
      <p className="mt-6 max-w-2xl text-base text-pretty text-muted md:text-lg">
        {PRODUCT_NAME}{' '}
        gathers the context scattered across your tools, so the people accountable can decide with
        everything in front of them.
      </p>
    </section>
  );
}
