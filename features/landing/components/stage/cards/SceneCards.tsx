/* One small caption card per scene. Each reads its own sample content from
   static/scenarios.ts, so the story copy and the illustration stay separate. */

import {
  ArrowRight,
  GitCommitHorizontal,
  ImageIcon,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONTRACT_BREAK,
  LOGIN_FLOW,
  PARSED_FILE,
  PUSH,
  QUESTION,
  STALE_DIAGRAM,
  TICKETS,
} from "../../../static/scenarios";
import { EDGES, NODES } from "../../../static/system";
import { CardCaption, CardShell } from "./CardShell";

function Resolves({ to }: { to: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-signal">
      <ArrowRight className="size-3" />
      {to}
    </span>
  );
}

export function StaleDiagramCard() {
  return (
    <CardCaption>
      <ImageIcon className="size-3.5" />
      {STALE_DIAGRAM.file}
      <span className="text-warn">{STALE_DIAGRAM.age}</span>
    </CardCaption>
  );
}

export function ParsedFileCard() {
  return (
    <CardShell>
      <p className="text-text-lo">{PARSED_FILE.path}</p>
      <ul className="mt-2 space-y-1">
        {PARSED_FILE.imports.map((line) => (
          <li
            key={line.statement}
            className="flex items-center justify-between gap-3"
          >
            <code className="truncate text-text-mid">{line.statement}</code>
            <Resolves to={line.resolvesTo} />
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

export function QuestionCard() {
  return (
    <CardShell className="space-y-2">
      <p className="ml-auto w-fit rounded-lg border border-signal-border bg-signal-soft px-2.5 py-1 text-text-hi">
        {QUESTION.ask}
      </p>
      <p className="text-text-mid">{QUESTION.answer}</p>
    </CardShell>
  );
}

export function FlowCard({ step }: { step: number }) {
  const current = LOGIN_FLOW.steps[step];

  return (
    <CardShell>
      <div className="flex items-center justify-between text-text-lo">
        <span>{LOGIN_FLOW.name}</span>
        <span className="flex gap-1">
          {LOGIN_FLOW.steps.map((s, i) => (
            <span
              key={s.nodeId}
              className={cn(
                "size-1.5 rounded-full transition-colors duration-300",
                i <= step ? "bg-signal" : "bg-line-2",
              )}
            />
          ))}
        </span>
      </div>
      <div
        key={step}
        className="mt-2 grid grid-cols-[3.5rem_1fr] gap-x-3 animate-in fade-in duration-300 motion-reduce:animate-none"
      >
        <span className="text-signal">{current.nodeId}</span>
        <span className="truncate text-text-hi">{current.call}</span>
        <span />
        <span className="truncate text-text-mid">{current.payload}</span>
      </div>
    </CardShell>
  );
}

export function TicketsCard() {
  return (
    <CardShell>
      <ul className="space-y-1.5">
        {TICKETS.map((ticket) => (
          <li key={ticket.key} className="flex items-center gap-3">
            <span className="shrink-0 text-text-lo">{ticket.key}</span>
            <span className="min-w-0 flex-1 truncate text-text-mid">
              {ticket.title}
            </span>
            <Resolves to={ticket.nodeId} />
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

export function ContractCard() {
  const { source, target, field, sent, expected } = CONTRACT_BREAK;

  return (
    <CardShell tone="critical">
      <p className="flex items-center gap-2 text-critical">
        <TriangleAlert className="size-3.5" />
        Contract mismatch
        <span className="ml-auto text-text-lo">
          {source} → {target}
        </span>
      </p>
      <p className="mt-2 text-text-mid">
        <code className="text-text-hi">{field}</code> sent in {sent}, read as{" "}
        {expected}.
      </p>
    </CardShell>
  );
}

export function PushCard() {
  return (
    <CardShell>
      <p className="flex items-center gap-2 text-text-lo">
        <GitCommitHorizontal className="size-3.5" />
        push <span className="text-text-hi">{PUSH.sha}</span> → {PUSH.branch}
      </p>
      <p className="mt-2 flex items-center justify-between gap-3">
        <span className="truncate text-text-mid">{PUSH.file}</span>
        <span className="shrink-0 text-signal">re-parsed</span>
      </p>
    </CardShell>
  );
}

export function SummaryCard() {
  const modules = NODES.filter((node) => node.kind === "module").length;

  return (
    <CardCaption>
      <span className="size-1.5 rounded-full bg-signal" />
      {modules} modules · {EDGES.length} dependencies ·
      <span className="text-signal">0 guessed</span>
    </CardCaption>
  );
}
