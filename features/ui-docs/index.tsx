import Card from '@/shared/components/card';
import ComponentSection from './components/component-section';
import ThemeToggle from './components/theme-toggle';
import { getColorTokens, getUiDocs } from './extract';

// Internal component docs, generated from shared/components (JSDoc + types) and ./examples.
export default async function UiDocs() {
  const docs = await getUiDocs();
  const colors = getColorTokens();

  return (
    <div className="mx-auto flex max-w-6xl gap-10 py-10">
      <nav
        aria-label="Components"
        className="sticky top-6 hidden h-fit w-44 shrink-0 flex-col gap-0.5 text-sm md:flex"
      >
        {['foundations', ...docs.map((doc) => doc.file)].map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-md px-2 py-1 text-muted capitalize hover:bg-fill-hover hover:text-foreground"
          >
            {id.replace('-', ' ')}
          </a>
        ))}
      </nav>

      <main className="flex min-w-0 flex-1 flex-col gap-16">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">UI components</h1>
            <p className="mt-1 text-sm text-muted">
              Everything in{' '}
              <code>shared/components</code>. Docs come from each component&apos;s JSDoc; examples
              live in <code>features/ui-docs/examples</code>.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <section id="foundations" className="flex scroll-mt-6 flex-col gap-4">
          <h2 className="text-xl font-bold">Foundations</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>
              Style with Tailwind utilities and the tokens below (<code>bg-surface</code>,{' '}
              <code>text-muted</code>, <code>border-border</code>), never raw hex.
            </li>
            <li>
              Every token flips in dark mode, so token-only UI needs no <code>dark:</code>{' '}
              overrides.
            </li>
            <li>
              Raised primary/secondary buttons and popovers share the 3D bottom edge (<code>
                shadow-chrome
              </code>).
            </li>
            <li>
              Merge classes with <code>cn</code> from{' '}
              <code>@/shared/lib/cn</code>; register new custom theme shadows there.
            </li>
          </ul>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {colors.map((name) => (
              <Card key={name} className="overflow-hidden p-0">
                {/* inline var so we don't need a safelist for dynamic class names */}
                <div className="h-12" style={{ background: `var(--color-${name})` }} />
                <p className="px-2 py-1.5 font-mono text-xs">{name}</p>
              </Card>
            ))}
          </div>
        </section>

        {docs.map((doc) => <ComponentSection key={doc.file} doc={doc} />)}
      </main>
    </div>
  );
}
