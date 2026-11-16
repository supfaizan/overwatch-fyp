import type { DecisionCapture } from '@/shared/decisions/types';
import { Robot } from '@phosphor-icons/react/ssr';
import type { ReactNode } from 'react';

/** Where a decision an AI tool recorded came from. What the tool reported is shown as reported: none of it is checked. */
export default function CaptureDetails({ capture }: { capture: DecisionCapture }) {
  const { code } = capture;
  const facts: { label: string; value: ReactNode }[] = [
    { label: 'Model', value: capture.agent_model },
    { label: 'Ticket', value: capture.ticket },
    { label: 'Repository', value: code?.repo },
    { label: 'Branch', value: code?.branch },
    { label: 'Commit', value: code?.commit },
    {
      label: 'Pull request',
      value: code?.pr_url && (
        <a href={code.pr_url} target="_blank" rel="noreferrer" className="underline">
          {code.pr_url}
        </a>
      ),
    },
  ].filter((fact) => {
    return Boolean(fact.value);
  });

  return (
    <section
      aria-label="Where it came from"
      className="flex flex-col gap-3 rounded-lg border border-border p-4 text-sm"
    >
      <h2 className="flex items-center gap-2 font-semibold">
        <Robot aria-hidden className="size-4" />
        Recorded through {capture.client}
      </h2>
      <p className="text-muted">
        {capture.user_approved
          ? 'The person using it asked for this to be recorded.'
          : 'The tool recorded this on its own; nobody was asked first.'}{' '}
        The background below is the tool's summary and hasn't been checked.
      </p>
      {capture.user_words && (
        <figure className="border-l-2 border-border-strong pl-3">
          <blockquote className="whitespace-pre-wrap">{capture.user_words}</blockquote>
          <figcaption className="text-xs text-muted">
            What they said, as the tool reported it
          </figcaption>
        </figure>
      )}
      {facts.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {facts.map((fact) => {
            return (
              <div key={fact.label} className="contents">
                <dt className="text-xs text-muted">{fact.label}</dt>
                <dd className="min-w-0 truncate">{fact.value}</dd>
              </div>
            );
          })}
        </dl>
      )}
      {code && code.files.length > 0 && (
        <ul className="font-mono text-xs text-muted">
          {code.files.map((file) => {
            return <li key={file} className="truncate">{file}</li>;
          })}
        </ul>
      )}
    </section>
  );
}
