'use client';

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

/** Narrower and the messages wrap word by word; wider and the diagram is barely left. */
const MIN_WIDTH = 320;
const MAX_WIDTH = 720;
const DEFAULT_WIDTH = 384;
/** The diagram keeps at least this much beside the chat. */
const MIN_CANVAS_WIDTH = 320;
const KEYBOARD_STEP = 24;
const WIDTH_KEY = 'overwatch:chat-width';

function readWidth(): number {
  try {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    return saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
}

function saveWidth(width: number) {
  try {
    localStorage.setItem(WIDTH_KEY, String(width));
  } catch {
    // a private window: the width just isn't remembered
  }
}

/**
 * Holds the chat beside the diagram, resizable by dragging (or arrow keys on) its left edge; the
 * width is remembered per browser. On narrow screens it covers the diagram instead.
 */
export default function ChatDock({ children }: { children: ReactNode }) {
  const dock = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(readWidth);

  const resize = (next: number) => {
    const room = (dock.current?.parentElement?.clientWidth ?? Infinity) - MIN_CANVAS_WIDTH;
    const clamped = Math.round(Math.max(MIN_WIDTH, Math.min(next, MAX_WIDTH, room)));
    setWidth(clamped);
    return clamped;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !dock.current) return;
    resize(dock.current.getBoundingClientRect().right - event.clientX);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: KEYBOARD_STEP, ArrowRight: -KEYBOARD_STEP }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    saveWidth(resize(width + step));
  };

  return (
    <div
      ref={dock}
      className="absolute inset-0 z-10 md:relative md:inset-auto md:w-(--chat-width) md:max-w-2/3 md:shrink-0"
      style={{ '--chat-width': `${width}px` } as CSSProperties}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize the chat"
        aria-valuenow={width}
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        tabIndex={0}
        className="group absolute inset-y-0 -left-1 z-20 hidden w-2 cursor-col-resize touch-none outline-none md:block"
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={() => saveWidth(width)}
        onDoubleClick={() => saveWidth(resize(DEFAULT_WIDTH))}
        onKeyDown={onKeyDown}
      >
        <span className="mx-auto block h-full w-0.5 transition-colors group-hover:bg-primary group-focus-visible:bg-primary group-active:bg-primary" />
      </div>
      {children}
    </div>
  );
}
