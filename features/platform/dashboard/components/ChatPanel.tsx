"use client";

import { useEffect, useRef, useState } from "react";
import { Info, Loader2, RotateCcw, Search, Send, Sparkles, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MAX_QUESTION_CHARS, useChat, useSelectNode, useShowNodeOnMap } from "../hooks";
import { AnswerReferences } from "./AnswerReferences";
import { AnswerText } from "./AnswerText";
import type { AnswerMode } from "../types";

/** Questions that work on any repository: a process, an overview, a
 *  boundary. */
const SUGGESTIONS = [
  "How does a user log in?",
  "What happens when a request comes in?",
  "Which services talk to each other, and how?",
];

/** Each mode, and what it costs — said where the choice is made. */
const MODES: { value: AnswerMode; label: string; title: string; pending: string }[] = [
  {
    value: "quick",
    label: "QUICK",
    title: "One AI call: the matching code, its call sequence and source. Fast and light on quota.",
    pending: "READING THE CODE — ANSWERS CAN TAKE ~20S",
  },
  {
    value: "deep",
    label: "DEEP",
    title:
      "The AI investigates first — searching, reading code and files — before answering. Up to 4 AI calls; best for questions a quick answer misses.",
    pending: "INVESTIGATING THE CODE — DEEP ANSWERS CAN TAKE ~1 MIN",
  },
];

export function ChatPanel() {
  const { messages, send, retry, clear, isPending, disabled, mode, setMode, pendingMode } = useChat();
  const hasConversation = messages.length > 1;
  const openInExplorer = useSelectNode();
  const showOnMap = useShowNodeOnMap();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isPending]);

  const submit = (text: string) => {
    if (send(text)) setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line-1 px-4 py-3">
        <span className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-signal" />
          <span className="ow-micro text-text-mid">CHAT</span>
        </span>
        <div
          role="radiogroup"
          aria-label="Answer mode"
          className="flex rounded-pill border border-line-1 bg-surface-1 p-0.5"
        >
          {MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={mode === option.value}
              onClick={() => setMode(option.value)}
              title={option.title}
              className={cn(
                "rounded-pill px-2 py-0.5 ow-micro transition-colors",
                mode === option.value ? "bg-signal-soft text-signal" : "text-text-lo hover:text-text-mid",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {hasConversation && (
          <button
            type="button"
            onClick={clear}
            disabled={isPending}
            title="Start a new conversation"
            className="flex items-center gap-1 ow-micro text-text-lo transition-colors hover:text-signal disabled:opacity-50"
          >
            <SquarePen className="size-3" aria-hidden /> NEW CHAT
          </button>
        )}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-3 p-4">
          {messages.map((m) => (
            <div key={m.id} className="space-y-1.5">
              <div
                className={cn(
                  "max-w-[90%] rounded-md border px-3 py-2 ow-body !text-[13px]",
                  m.role === "user"
                    ? "ml-auto border-signal-border bg-signal-soft text-text-hi"
                    : "border-line-1 bg-surface-1 text-text-mid",
                )}
              >
                {m.role === "assistant" ? (
                  <AnswerText text={m.content} references={m.references ?? []} onShow={showOnMap} />
                ) : (
                  m.content
                )}
              </div>
              {m.notice && (
                <p className="flex max-w-[90%] items-start gap-1.5 ow-micro text-warn">
                  <Info className="mt-px size-3 shrink-0" aria-hidden />
                  {m.notice}
                </p>
              )}
              {m.failed && (
                <p className="flex items-center justify-end gap-2 ow-micro text-critical">
                  NOT ANSWERED
                  <button
                    type="button"
                    onClick={() => retry(m)}
                    disabled={isPending}
                    className="flex items-center gap-1 text-text-lo transition-colors hover:text-signal disabled:opacity-50"
                  >
                    <RotateCcw className="size-3" aria-hidden /> RETRY
                  </button>
                </p>
              )}
              {m.lookups && m.lookups.length > 0 && (
                <p
                  className="flex max-w-[90%] items-start gap-1.5 ow-micro text-text-dim"
                  title="What the deep answer looked up before answering"
                >
                  <Search className="mt-px size-3 shrink-0" aria-hidden />
                  <span className="break-all">LOOKED UP {m.lookups.join(" · ")}</span>
                </p>
              )}
              {m.references && m.references.length > 0 && (
                <AnswerReferences
                  references={m.references}
                  onShow={showOnMap}
                  onExplore={openInExplorer}
                />
              )}
            </div>
          ))}
          {isPending && (
            <div className="flex items-center gap-2 ow-micro text-text-dim">
              <Loader2 className="size-3.5 animate-spin text-signal" />
              {MODES.find((option) => option.value === pendingMode)?.pending}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-line-1 p-3">
        {!hasConversation && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              disabled={isPending || disabled}
              className="rounded-pill border border-line-1 bg-surface-1 px-2.5 py-1 ow-micro text-text-lo transition-colors hover:border-signal-border hover:text-signal disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        )}
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
            maxLength={MAX_QUESTION_CHARS}
            aria-label="Ask a question about the repository"
            placeholder={
              disabled ? "Connect a repository first…" : "Ask about the system…"
            }
            className="h-9 flex-1 rounded-md border border-line-2 bg-surface-1 px-3 font-mono text-[13px] text-text-hi outline-none placeholder:text-text-dim focus:border-signal-border"
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
