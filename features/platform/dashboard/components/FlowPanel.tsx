"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Loader2,
  Map as MapIcon,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Route,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MAX_QUESTION_CHARS, useFlow, useSelectNode } from "../hooks";
import { FLOW_VIA_PHRASE } from "../graph/lib/appearance";
import type { CanvasMode } from "../stores/dashboard-store";
import type { FlowResult, FlowStep } from "../types";

/** Indent per level of the call tree, and the deepest it visibly indents —
 *  past that the panel would be all margin. */
const INDENT_PX = 12;
const MAX_INDENT_LEVELS = 8;
/** Unfollowed calls listed under a step before the rest are counted. */
const GAPS_SHOWN = 3;

const SUGGESTIONS = [
  "What happens when a user logs in?",
  "How does a request reach the database?",
  "Walk me through application startup",
];

export function FlowPanel() {
  const {
    flow,
    cursor,
    playing,
    isPending,
    disabled,
    startsFrom,
    request,
    play,
    pause,
    seek,
    reset,
    canvas,
    viewFlow,
    viewMap,
    showInMap,
  } = useFlow();
  const openInExplorer = useSelectNode();
  const [input, setInput] = useState("");

  const submit = (text: string) => {
    if (request(text)) setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line-1 px-4 py-3">
        <span className="flex items-center gap-2">
          <Route className="size-3.5 text-signal" />
          <span className="ow-micro text-text-mid">FLOW WALKTHROUGH</span>
        </span>
        {flow && (
          <span className="flex items-center gap-1">
            <IconButton
              label={playing ? "Pause walkthrough" : "Play walkthrough"}
              onClick={playing ? pause : play}
            >
              {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
            </IconButton>
            <IconButton label="Clear walkthrough" onClick={reset}>
              <RotateCcw className="size-3" />
            </IconButton>
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isPending && (
          <p className="flex items-center gap-2 ow-micro text-text-dim">
            <Loader2 className="size-3.5 animate-spin text-signal" />
            TRACING THROUGH THE GRAPH…
          </p>
        )}

        {!isPending && !flow && (
          <p className="ow-body !text-[13px] text-text-dim">
            Describe a process — a page, a route, a function — and the graph is
            walked step by step. Every step is joined to the next by a real call,
            request or render, so the walkthrough shows what the code actually does.
          </p>
        )}

        {flow && (
          <div className="space-y-3">
            <FlowSummary
              flow={flow}
              canvas={canvas}
              onToggleCanvas={canvas === "flow" ? viewMap : viewFlow}
            />
            <ol>
              {flow.steps.map((step, index) => (
                <StepRow
                  key={`${step.nodeId}-${index}`}
                  step={step}
                  index={index}
                  cursor={cursor}
                  onSeek={() => seek(index)}
                  onExplore={() => openInExplorer(step.nodeId)}
                  onShowInMap={() => showInMap(index)}
                />
              ))}
            </ol>
            <FlowEnding flow={flow} />
          </div>
        )}
      </div>

      <div className="border-t border-line-1 p-3">
        {!flow && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => submit(suggestion)}
                disabled={isPending || disabled}
                className="rounded-pill border border-line-1 bg-surface-1 px-2.5 py-1 ow-micro text-text-lo transition-colors hover:border-signal-border hover:text-signal disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        {startsFrom && (
          <p className="mb-2 ow-micro text-text-dim">
            STARTS FROM THE SELECTED NODE
          </p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={disabled}
            maxLength={MAX_QUESTION_CHARS}
            aria-label="Describe a flow to trace"
            placeholder={disabled ? "Connect a repository first…" : "Describe a flow…"}
            className="h-9 flex-1 rounded-md border border-line-2 bg-surface-1 px-3 font-mono text-[13px] text-text-hi outline-none placeholder:text-text-dim focus:border-signal-border"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending || disabled || !input.trim()}
            className="size-9 shrink-0"
            aria-label="Trace flow"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-sm border border-line-1 bg-surface-1 p-1 text-text-mid transition-colors hover:text-signal"
    >
      {children}
    </button>
  );
}

/** How far to trust the walkthrough, and the way to see it in full detail. */
function FlowSummary({
  flow,
  canvas,
  onToggleCanvas,
}: {
  flow: FlowResult;
  canvas: CanvasMode;
  onToggleCanvas: () => void;
}) {
  const inferred = flow.confidence === "inferred";
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        title={
          inferred
            ? "No chain of calls connects these; the path follows imports instead."
            : "Every step is joined to the next by a resolved call, request or render."
        }
        className={cn(
          "rounded-sm border px-1.5 py-0.5 ow-micro",
          inferred ? "border-warn/40 text-warn" : "border-signal-border text-signal",
        )}
      >
        {inferred ? "INFERRED FROM IMPORTS" : "TRACED"} · {flow.steps.length}{" "}
        {flow.steps.length === 1 ? "STEP" : "STEPS"}
        {flow.mode === "sequence" ? " · IN CALL ORDER" : " · PATH"}
      </span>
      <button
        type="button"
        onClick={onToggleCanvas}
        title={canvas === "flow" ? "See the whole repository map" : "See only this walkthrough"}
        className="flex items-center gap-1 ow-micro text-text-lo transition-colors hover:text-signal"
      >
        {canvas === "flow" ? (
          <><MapIcon className="size-3" aria-hidden /> MAP VIEW</>
        ) : (
          <><Route className="size-3" aria-hidden /> FLOW VIEW</>
        )}
      </button>
    </div>
  );
}

function StepRow({
  step,
  index,
  cursor,
  onSeek,
  onExplore,
  onShowInMap,
}: {
  step: FlowStep;
  index: number;
  cursor: number;
  onSeek: () => void;
  onExplore: () => void;
  onShowInMap: () => void;
}) {
  const active = index === cursor;
  const past = index < cursor;
  const indent = Math.min(step.depth, MAX_INDENT_LEVELS) * INDENT_PX;

  return (
    <li style={{ paddingLeft: indent }}>
      {step.via && (
        <p className="flex items-center gap-1.5 py-1 pl-2.5 ow-micro text-text-dim">
          <ArrowDown className="size-3" aria-hidden />
          {FLOW_VIA_PHRASE[step.via] ?? step.via.toLowerCase()}
        </p>
      )}
      <div
        className={cn(
          "ow-panel flex items-start gap-2.5 p-2 transition-colors",
          active && "border-signal-border bg-signal-soft",
        )}
      >
        <button
          type="button"
          onClick={onSeek}
          aria-current={active ? "step" : undefined}
          className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
        >
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border ow-micro",
              active
                ? "border-signal bg-signal text-signal-ink"
                : past
                  ? "border-signal-border text-signal"
                  : "border-line-2 text-text-dim",
            )}
          >
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "truncate font-mono text-[12px]",
                  active ? "text-text-hi" : "text-text-mid",
                )}
              >
                {step.name}
              </span>
              <span className="shrink-0 ow-micro text-text-dim">
                {step.kind ?? step.label?.toLowerCase()}
              </span>
            </span>
            {step.path && (
              <span className="mt-0.5 block truncate font-mono text-[10px] text-text-lo">
                {step.path}
              </span>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={onShowInMap}
          aria-label={`Show ${step.name} in the map`}
          title="Show in the map"
          className="shrink-0 text-text-dim transition-colors hover:text-signal"
        >
          <MapPin className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onExplore}
          aria-label={`Explore ${step.name}`}
          title="Open in the explorer"
          className="shrink-0 text-text-dim transition-colors hover:text-signal"
        >
          <ArrowUpRight className="size-3.5" />
        </button>
      </div>
      {step.unresolved.length > 0 && <StepGaps calls={step.unresolved} />}
    </li>
  );
}

/** The calls a step makes that could not be followed — why the trail stops
 *  there, in the code's own words. */
function StepGaps({ calls }: { calls: string[] }) {
  const hidden = calls.length - GAPS_SHOWN;
  return (
    <p
      className="mt-1 pl-7 ow-micro text-text-dim"
      title="Calls on values whose type the code does not state, or that could reach more than one place"
    >
      COULD NOT FOLLOW{" "}
      {calls.slice(0, GAPS_SHOWN).map((call) => (
        <code key={call} className="mr-1 rounded-sm bg-surface-2 px-1 font-mono text-[10px] text-warn">
          {call}
        </code>
      ))}
      {hidden > 0 && `+${hidden} more`}
    </p>
  );
}

/** Where the trail stopped, said plainly rather than papered over. */
function FlowEnding({ flow }: { flow: FlowResult }) {
  const last = flow.steps.at(-1);
  if (!last) return null;

  let message: string | null = null;
  if (flow.targetReached === false) {
    message = "No resolved path reaches the end you asked about, so this shows what the start does instead.";
  } else if (flow.steps.length === 1 && last.unresolved.length === 0) {
    message = `Nothing leads out of ${last.name} in this repository: what it calls is in packages, or decided at runtime.`;
  }
  if (!message) return null;

  return <p className="ow-body !text-[12px] text-text-dim">{message}</p>;
}
