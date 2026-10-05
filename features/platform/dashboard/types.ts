import type { Priority } from "@/types";

/* The canvas types live in ./graph/types — the diagram is a level-of-detail
   view of the graph, not a fixed module picture. */

/** Out of eval-1 scope (contract checker). The panel is unrouted but kept in
 *  the tree, so the type stays. See the eval-1 plan, "Explicitly out of scope". */
export interface ContractWarning {
  id: string;
  priority: Priority;
  title: string;
  source: string;
  target: string;
  risk: string;
  suggestion: string;
  tgnnConfidence: number;
  nodeIds: string[];
  createdAt: string;
}

export type ChatRole = "user" | "assistant";

/** A node an answer relies on. `number` is how the answer's text cites it
 *  (`[12]`); `containers` is what the map opens or lights to show it. */
export interface AnswerReference {
  number: number;
  nodeId: string;
  name: string;
  label: string | null;
  kind: string | null;
  path: string | null;
  containers: string[];
}

/** "quick": one model call over context built for the question. "deep": the
 *  model may look things up (search, read code, trace) first — a few more
 *  calls, for questions the quick context does not settle. */
export type AnswerMode = "quick" | "deep";

/** "graph_only": the model could not be used, so the answer was built from
 *  the code graph alone — `notice` says why. */
export type AnswerStatus = "answered" | "graph_only";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** The nodes an answer drew on, cited in its text as `[n]`. */
  references?: AnswerReference[];
  /** Why an answer came from the graph alone, when it did. */
  notice?: string | null;
  /** What a deep answer looked up on its way, in order. */
  lookups?: string[];
  /** A question that never got an answer; it can be retried. */
  failed?: boolean;
}

/** An earlier message, sent with a follow-up so "it" and "those" resolve. */
export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface QueryResult {
  answer: string;
  references: AnswerReference[];
  status: AnswerStatus;
  notice: string | null;
  mode: AnswerMode;
  lookups: string[];
}

/** How one flow step was reached from the step before it. */
export type FlowVia =
  | "REQUESTS"
  | "HANDLES"
  | "SENDS"
  | "RECEIVES"
  | "CALLS"
  | "RENDERS"
  | "IMPORTS";

/** One step of a walkthrough: a real definition, file or route. */
export interface FlowStep {
  nodeId: string;
  name: string;
  label: string | null;
  kind: string | null;
  path: string | null;
  /** The relationship from the previous step; null for the first. */
  via: FlowVia | null;
  /** Containers to open to draw this step itself, outermost first. */
  containers: string[];
  /** Index of the step that led here; null for the start. */
  parent: number | null;
  /** How far into the call tree: 0 for the start. Always 0 on a path. */
  depth: number;
  /** Where the trail stops here, the calls that could not be followed. */
  unresolved: string[];
}

export interface FlowResult {
  steps: FlowStep[];
  /** "inferred" when no call path existed and imports were followed. */
  confidence: "traced" | "inferred";
  /** null: no end was asked for. false: one was, and no path reaches it. */
  targetReached: boolean | null;
  /** "path": a chain to the end asked for. "sequence": what the start does,
   *  as a call tree in source order. */
  mode: "path" | "sequence";
}
