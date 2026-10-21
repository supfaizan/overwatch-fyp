import Brand from '@/shared/components/brand';
import { LEGAL_DOCUMENTS } from './documents';

export { LEGAL_DOCUMENTS } from './documents';

/** One of the legal pages, as a plain readable document. */
export default function LegalPage({ document }: { document: keyof typeof LEGAL_DOCUMENTS }) {
  const { title, updated, intro, sections } = LEGAL_DOCUMENTS[document];
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 py-6 pb-24">
      <Brand />
      <header className="flex flex-col gap-3 pt-10">
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted">Last updated {updated}</p>
        <p className="text-lg text-muted">{intro}</p>
      </header>
      {sections.map((section) => {
        return (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">{section.heading}</h2>
            <p className="leading-relaxed text-muted">{section.body}</p>
          </section>
        );
      })}
    </main>
  );
}
