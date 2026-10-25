'use client';

import Button from '@/shared/components/button';
import { ArrowBendDownRight } from '@phosphor-icons/react/ssr';

/** Questions to go deeper after an overview; picking one asks it. */
export default function FollowUps(
  { questions, onPick, disabled }: {
    questions: string[];
    onPick: (question: string) => void;
    /** while an answer is being written */
    disabled: boolean;
  },
) {
  return (
    <section aria-label="Go deeper" className="flex flex-col gap-1.5 px-1">
      <span className="text-xs text-muted">Go deeper</span>
      <ul className="flex flex-wrap gap-1.5">
        {questions.map((question) => {
          return (
            <li key={question}>
              <Button
                size="sm"
                variant="secondary"
                raised={false}
                disabled={disabled}
                className="h-auto py-1.5 text-left whitespace-normal"
                onClick={() => {
                  return onPick(question);
                }}
              >
                <ArrowBendDownRight aria-hidden />
                {question}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
