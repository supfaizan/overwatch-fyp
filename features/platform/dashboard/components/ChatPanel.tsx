"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useChat } from "../hooks";
import { useDashboardStore } from "../stores/dashboard-store";
import { AnswerReferences } from "./AnswerReferences";

const SUGGESTIONS = [
  "Which modules have the most dependents?",
  "What does the entry point import?",
  "Which modules pull in third-party packages?",
];

export function ChatPanel() {
  const { messages, send, isPending, disabled } = useChat();
  const openInExplorer = useDashboardStore((state) => state.selectNode);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isPending]);

  const submit = (text: string) => {
    send(text);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line-1 px-4 py-3">
        <Sparkles className="size-3.5 text-signal" />
        <span className="ow-mono-micro text-text-mid">CHAT</span>
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
                {m.content}
              </div>
              {m.references && m.references.length > 0 && (
                <AnswerReferences
                  references={m.references}
                  onOpen={openInExplorer}
                />
              )}
            </div>
          ))}
          {isPending && (
            <div className="flex items-center gap-2 ow-mono-micro text-text-dim">
              <Loader2 className="size-3.5 animate-spin text-signal" />
              REASONING OVER GRAPH…
            </div>
          )}
        </div>
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
              disabled ? "Connect a repository first…" : "Ask about the system…"
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
