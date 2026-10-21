import { PRODUCT_NAME } from '@/shared/lib/env';
import { CaretDown } from '@phosphor-icons/react/ssr';

const QUESTIONS = [
  {
    question: `What is ${PRODUCT_NAME}?`,
    answer:
      `${PRODUCT_NAME} maps your codebase and connects it to the decisions behind it: the tickets, docs, threads and meetings where they were made. When someone asks why something works the way it does, the answer and its sources are one click away.`,
  },
  {
    question: `Does ${PRODUCT_NAME} make decisions for us?`,
    answer:
      'No. People stay accountable for every decision. It gathers the context, surfaces contradictions and traces each decision back to where it came from, so your team decides faster and with everything in front of them.',
  },
  {
    question: 'How is it different from a wiki or our ticket tracker?',
    answer:
      'Wikis and trackers hold pieces of a decision. We connect those pieces to each other and to the code they affect, and keep them current as the code changes, so nothing goes stale in a forgotten page.',
  },
  {
    question: 'Which tools does it work with?',
    answer:
      'GitHub, Jira and Confluence today, with Slack, Google Meet, Google Calendar, Figma, GitLab and more on the way.',
  },
  {
    question: 'What happens to our code and data?',
    answer:
      'We only ask for read access to your repositories, and your workspace is visible only to the people you invite. You can disconnect a repository at any time, and its copy and graph are deleted.',
  },
  {
    question: 'When can I get access, and what does it cost?',
    answer:
      "We're letting teams in from the waitlist in small groups. The private beta is free for everyone in it.",
  },
] as const;

export default function Faq({ id }: { id: string }) {
  return (
    <section id={id} className="mx-auto flex max-w-3xl scroll-mt-8 flex-col gap-12 px-4 py-24">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Frequently asked <span className="font-normal italic">questions</span>
        </h2>
        <p className="text-balance text-muted md:text-lg">
          What teams usually ask before they bring their decisions in.
        </p>
      </div>
      <div className="flex flex-col">
        {QUESTIONS.map(({ question, answer }) => {
          return (
            <details key={question} className="group border-b border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-lg font-medium transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                {question}
                <CaretDown
                  aria-hidden
                  className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="pb-6 leading-relaxed text-muted">{answer}</p>
            </details>
          );
        })}
      </div>
    </section>
  );
}
