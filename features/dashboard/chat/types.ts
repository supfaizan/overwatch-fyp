// mirrors the backend schemas (app/chat)

/** A node a message points at: an answer's `[nX]` citation, or a question's @-mention. */
export type NodeRef = {
  /** the `nX` used inline in an answer; null for a mention */
  ref: string | null;
  node_id: string;
  module_id: string;
  name: string;
};

/** Lines of the repository an answer points at with `[cN]`, copied from the file by the backend. */
export type CodeCitation = {
  /** the `cN` used inline in the answer */
  ref: string;
  path: string;
  /** the commit the lines were read at */
  commit_sha: string;
  start_line: number;
  end_line: number;
  code: string;
  language: string | null;
  /** the node the code belongs to; null for a range an earlier answer cited */
  node_id: string | null;
};

/** One step of a flow an answer walks through, in order. */
type FlowStep = {
  /** the step's `nX`; its node is among the message's `nodes` */
  ref: string;
  node_id: string;
  /** markdown; may hold further `[nX]` and `[cN]` */
  text: string;
  /** a `cN` among the message's `citations` */
  citation_ref: string | null;
};

/** A question back, asked only when the question could mean different things. */
export type ClarifyingQuestion = { question: string; options: string[] };

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  nodes: NodeRef[];
  /** code an answer cites; empty for questions */
  citations: CodeCitation[];
  /** the flow an answer walks through; empty for questions and answers not about a flow */
  steps: FlowStep[];
  /** questions to go deeper; empty for questions and most narrow answers */
  follow_ups: string[];
  /** a question back instead of an answer; null almost always */
  ask: ClarifyingQuestion | null;
  /** false when the answer was refused or the graph couldn't answer it */
  grounded: boolean;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  repo_full_name: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type Conversation = ConversationSummary & { messages: ChatMessage[] };

export type AskBody = {
  repo_full_name: string;
  question: string;
  conversation_id?: string;
  focused_node_id?: string;
  mentioned_node_ids: string[];
  /** folders open on the canvas, most recently opened first */
  open_folder_ids: string[];
};

export type AskResult = {
  conversation: ConversationSummary;
  question: ChatMessage;
  answer: ChatMessage;
};

/** A file or symbol from graph search, offered after `@`. */
export type MentionCandidate = {
  id: string;
  name: string | null;
  kind: string | null;
  path: string | null;
  file_path: string | null;
};

/** A mention picked in the composer. */
export type Mention = { nodeId: string; name: string };

/** A file as of one commit, for reading what an answer cites. */
export type SourceFile = {
  path: string;
  commit_sha: string;
  language: string | null;
  /** the first 5,000 lines at most */
  content: string;
  line_count: number;
  truncated: boolean;
  /** whether `commit_sha` is the commit the graph is built from now */
  is_current: boolean;
};
