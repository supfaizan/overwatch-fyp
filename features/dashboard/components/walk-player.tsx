'use client';

import Button from '@/shared/components/button';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { CaretLeft, CaretRight, Pause, Play, X } from '@phosphor-icons/react/ssr';
import { type KeyboardEvent, useEffect } from 'react';
import { stepName, WALK_STEP_MS } from '../lib/walkthrough';
import { useViewStore } from '../store';

/**
 * Plays a walkthrough and lets you take over: previous / play-pause / next, a chip per step to jump
 * to, and close. ←/→ step, Space plays or pauses and Esc closes while it has focus. It moves on only
 * once the last step has been drawn and panned to, so a slow folder never gets skipped.
 */
export default function WalkPlayer({ repo }: { repo: string }) {
  const walk = useViewStore((state) => {
    return state.walk;
  });
  const settling = useViewStore((state) => {
    return state.focusRequest !== null;
  });
  const { goTo, setPlaying, endWalk } = useViewStore.getState();

  useEffect(() => {
    if (!walk?.playing || settling) {
      return;
    }
    const timer = setTimeout(() => {
      if (walk.cursor < walk.steps.length - 1) {
        goTo(walk.cursor + 1, true);
      } else {
        setPlaying(false);
      }
    }, WALK_STEP_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [walk, settling, goTo, setPlaying]);

  if (!walk) {
    return null;
  }
  const { steps, cursor, playing } = walk;
  const last = steps.length - 1;
  const current = stepName(steps[cursor].nodeId, repo);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && cursor > 0) {
      goTo(cursor - 1);
    } else if (event.key === 'ArrowRight' && cursor < last) {
      goTo(cursor + 1);
    } else if (event.key === ' ') {
      setPlaying(!playing);
    } else if (event.key === 'Escape') {
      endWalk();
    } else {
      return;
    }
    event.preventDefault();
  };

  return (
    <div
      role="toolbar"
      aria-label="Walkthrough"
      onKeyDown={onKeyDown}
      className="absolute bottom-3 left-1/2 flex max-w-11/12 -translate-x-1/2 items-center gap-2 rounded-lg border border-border bg-surface/95 p-1.5 shadow-sm backdrop-blur-sm"
    >
      <Tooltip content="Previous step">
        <Button
          size="sm"
          variant="tertiary"
          iconOnly
          aria-label="Previous step"
          disabled={cursor === 0}
          onClick={() => {
            return goTo(cursor - 1);
          }}
        >
          <CaretLeft />
        </Button>
      </Tooltip>
      <Tooltip content={playing ? 'Pause' : cursor === last ? 'Play again' : 'Play'}>
        <Button
          size="sm"
          variant="tertiary"
          iconOnly
          aria-label={playing ? 'Pause' : cursor === last ? 'Play again' : 'Play'}
          onClick={() => {
            return setPlaying(!playing);
          }}
        >
          {playing ? <Pause /> : <Play />}
        </Button>
      </Tooltip>
      <Tooltip content="Next step">
        <Button
          size="sm"
          variant="tertiary"
          iconOnly
          aria-label="Next step"
          disabled={cursor === last}
          onClick={() => {
            return goTo(cursor + 1);
          }}
        >
          <CaretRight />
        </Button>
      </Tooltip>

      <p aria-live="polite" className="min-w-0 truncate px-1 text-xs text-muted">
        {cursor + 1} of {steps.length} ·{' '}
        <span className="font-mono text-foreground">{current}</span>
      </p>

      <ol className="flex min-w-0 items-center gap-1 overflow-x-auto">
        {steps.map((step, index) => {
          const name = stepName(step.nodeId, repo);
          return (
            <li key={index}>
              <button
                type="button"
                title={name}
                aria-label={`Step ${index + 1}: ${name}`}
                aria-current={index === cursor ? 'step' : undefined}
                onClick={() => {
                  return goTo(index);
                }}
                className={cn(
                  'flex h-5 min-w-5 cursor-pointer items-center justify-center rounded-full px-1 text-xs tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                  index === cursor
                    ? 'bg-primary text-white'
                    : index < cursor
                    ? 'bg-primary/15 text-primary hover:bg-primary/25'
                    : 'border border-border text-muted hover:border-primary hover:text-primary',
                )}
              >
                {index + 1}
              </button>
            </li>
          );
        })}
      </ol>

      <Tooltip content="Close the walkthrough">
        <Button
          size="sm"
          variant="tertiary"
          iconOnly
          aria-label="Close the walkthrough"
          onClick={endWalk}
        >
          <X />
        </Button>
      </Tooltip>
    </div>
  );
}
