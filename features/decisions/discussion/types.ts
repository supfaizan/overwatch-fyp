/** A file sent with a message (or uploaded, ready to send). */
export type DiscussionAttachment = {
  id: string;
  filename: string;
  content_type: string;
  /** image, pdf, document, spreadsheet, presentation or text */
  kind: string;
  size: number;
};

/** A message in a decision's discussion, as the backend sends it to every viewer. */
export type DiscussionMessage = {
  id: string;
  decision_id: string;
  /** as the author was named when they wrote it, so a former member still shows */
  author: { id: string | null; name: string | null };
  /** Markdown */
  body: string;
  /** the id the sender's client gave it, to match it to the message shown as sending */
  client_id: string | null;
  /** in the order each emoji was first used; `user_ids` first reactor first */
  reactions: { emoji: string; user_ids: string[] }[];
  attachments: DiscussionAttachment[];
  /** goes up with every change: of two copies, the higher version is the newer */
  version: number;
  edited: boolean;
  created_at: string;
  updated_at: string;
};

/** One page of the discussion, oldest first; `hasMore` says whether older messages remain. */
export type DiscussionPage = { messages: DiscussionMessage[]; hasMore: boolean };

/** A message sent from this tab that the backend hasn't answered yet, or that failed. */
export type PendingMessage = {
  clientId: string;
  body: string;
  attachments: DiscussionAttachment[];
  status: 'sending' | 'failed';
  createdAt: string;
};
