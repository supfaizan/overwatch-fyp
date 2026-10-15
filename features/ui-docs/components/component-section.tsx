import Card from '@/shared/components/card';
import Tag from '@/shared/components/tag';
import { examples } from '../examples';
import type { FileDoc } from '../extract';

const Code = ({ children }: { children: string }) => {
  return (
    <pre className="overflow-x-auto rounded-md bg-fill-hover p-3 font-mono text-xs leading-relaxed">
    <code>{children}</code>
    </pre>
  );
};

export default function ComponentSection({ doc }: { doc: FileDoc }) {
  const live = examples[doc.file] ?? {};

  return (
    <section id={doc.file} className="flex scroll-mt-6 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold capitalize">{doc.file.replace('-', ' ')}</h2>
        <Code>{doc.importLine}</Code>
      </div>

      {doc.examples.length === 0 && (
        <p className="text-sm text-warning-strong">
          No examples yet: add them in features/ui-docs/examples/{doc.file}.tsx
        </p>
      )}
      {doc.examples.map(({ name, title, source }) => {
        const Example = live[name];
        return (
          <Card key={name} className="overflow-hidden p-0">
            <p className="border-b border-border px-4 py-2 text-xs font-semibold text-muted">
              {title}
            </p>
            <div className="flex flex-wrap items-center gap-3 p-6">{Example && <Example />}</div>
            {/* native disclosure: accessible and needs no client JS */}
            <details className="border-t border-border">
              <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-muted hover:text-foreground">
                Show code
              </summary>
              <div className="px-4 pb-4">
                <Code>{source}</Code>
              </div>
            </details>
          </Card>
        );
      })}

      {doc.components.map((component) => {
        return (
          <div key={component.name} className="flex flex-col gap-3">
            {doc.components.length > 1 && (
              <h3 className="font-mono text-sm font-semibold">{component.name}</h3>
            )}
            {component.description
              ? <p className="text-sm">{component.description}</p>
              : (
                <p className="text-sm text-warning-strong">
                  Undocumented: add a JSDoc comment to {component.name}.
                </p>
              )}
            {component.practices.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {component.practices.map((practice) => {
                  return <li key={practice}>{practice}</li>;
                })}
              </ul>
            )}
            {component.props.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-fill-hover text-xs text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Prop</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Default</th>
                      <th className="px-3 py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    {component.props.map((prop) => {
                      return (
                        <tr key={prop.name} className="align-top">
                          <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                            {prop.name} {prop.required && <Tag variant="primary">required</Tag>}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-muted">{prop.type}</td>
                          <td className="px-3 py-2 font-mono text-xs text-muted">
                            {prop.defaultValue ?? '-'}
                          </td>
                          <td className="px-3 py-2 text-muted">{prop.description}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
