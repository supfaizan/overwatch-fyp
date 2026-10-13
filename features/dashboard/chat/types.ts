// mirrors the backend schemas (app/chat)

/** A node a message points at: an answer's `[nX]` citation, or a question's @-mention. */
export type NodeRef = {
  /** the `nX` used inline in an answer; null for a mention */
  ref: string | null;
  node_id: string;
  module_id: string;
  name: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  nodes: NodeRef[];
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

export type AskResult = { conversation: ConversationSummary; question: ChatMessage; answer: ChatMessage };

/** A file or symbol from graph search, offered after `@`. */
export type MentionCandidate = { id: string; name: string | null; kind: string | null; path: string | null; file_path: string | null };

/** A mention picked in the composer. */
export type Mention = { nodeId: string; name: string };
