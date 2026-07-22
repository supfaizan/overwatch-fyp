"use client";

import { useState } from "react";
import { Route, Play, Pause, RotateCcw, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFlow } from "../hooks";

const SUGGESTIONS = [
  "How does a request reach the database?",
  "Walk me through application startup",
  "Trace how the API layer uses the services",
];

export function FlowPanel() {
  const {
    steps,
    cursor,
    playing,
    isPending,
    disabled,
    request,
    play,
    pause,
    seek,
    reset,
  } = useFlow();
  const [input, setInput] = useState("");

  const submit = (text: string) => {
    request(text);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line-1 px-4 py-3">
        <span className="flex items-center gap-2">
          <Route className="size-3.5 text-signal" />
          <span className="ow-mono-micro text-text-mid">FLOW WALKTHROUGH</span>
        </span>
        {steps.length > 0 && (
          <span className="flex items-center gap-1">
            <button
              onClick={playing ? pause : play}
              className="rounded-sm border border-line-1 bg-surface-1 p-1 text-text-mid transition-colors hover:text-signal"
              aria-label={playing ? "Pause walkthrough" : "Play walkthrough"}
            >
              {playing ? (
                <Pause className="size-3" />
              ) : (
                <Play className="size-3" />
              )}
            </button>
            <button
              onClick={reset}
              className="rounded-sm border border-line-1 bg-surface-1 p-1 text-text-mid transition-colors hover:text-signal"
              aria-label="Clear walkthrough"
            >
              <RotateCcw className="size-3" />
            </button>
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isPending && (
          <div className="flex items-center gap-2 ow-mono-micro text-text-dim">
            <Loader2 className="size-3.5 animate-spin text-signal" />
            RECONSTRUCTING FLOW…
          </div>
        )}

        {!isPending && steps.length === 0 && (
          <p className="ow-body !text-[13px] text-text-dim">
            Describe a process and the graph will be walked one module at a time.
            Steps the model names that aren&apos;t in the graph are dropped
            server-side, so the animation only ever moves through real modules.
          </p>
        )}

        {steps.length > 0 && (
          <ol className="space-y-1.5">
            {steps.map((step, index) => {
              const active = index === cursor;
              const past = index < cursor;
              return (
                <li key={`${step.id}-${index}`}>
                  <button
                    onClick={() => seek(index)}
                    className={cn(
                      "ow-panel flex w-full items-center gap-2.5 p-2 text-left transition-colors",
                      active && "border-signal-border bg-signal-soft",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border ow-mono-micro",
                        active
                          ? "border-signal bg-signal text-ink-900"
                          : past
                            ? "border-signal-border text-signal"
                            : "border-line-2 text-text-dim",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={cn(
                        "ow-mono-data !text-[11px]",
                        active ? "text-text-hi" : "text-text-mid",
                      )}
                    >
                      {step.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="border-t border-line-1 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              disabled={isPending || disabled}
              className="rounded-pill border border-line-1 bg-surface-1 px-2.5 py-1 ow-mono-micro text-text-lo transition-colors hover:border-signal-border hover:text-signal disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder={
              disabled ? "Connect a repository first…" : "Describe a flow…"
            }
            className="h-9 flex-1 rounded-md border border-line-2 bg-ink-850 px-3 font-mono text-[13px] text-text-hi outline-none placeholder:text-text-dim focus:border-signal-border"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending || disabled || !input.trim()}
            className="size-9 shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
