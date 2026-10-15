// mirrors the backend schemas (app/work_items, app/connectors)

import type { ConnectionStatus } from '@/shared/connections/constants';
import type { JobStatus } from '@/shared/lib/job-status';

export const STATUS_CATEGORY = { todo: 'todo', inProgress: 'in_progress', done: 'done' } as const;

export type StatusCategory = (typeof STATUS_CATEGORY)[keyof typeof STATUS_CATEGORY];

/** `WorkItem.source` for items created in Overwatch; tracker items carry their provider instead. */
export const NATIVE_SOURCE = 'native';

export type WorkItem = {
  id: string;
  /** "native" for items created in Overwatch, otherwise the tracker it mirrors (e.g. "jira"). */
  source: string;
  key: string;
  title: string;
  description: string | null;
  /** The description as Markdown, for display (a tracker's rich text converted); edits go through `description`. */
  description_md: string | null;
  /** The tracker's own status name; null for native items. */
  status: string | null;
  /** The tracker's status id; null for native items. */
  status_id?: string | null;
  status_category: StatusCategory;
  /** The board column it's in; null for a tracker status no column holds (hidden, as in the tracker). */
  column_id: string | null;
  /** Its open sprint; null is the backlog. */
  sprint_id: string | null;
  rank: number;
  assignee: { id: string | null; name: string | null } | null;
  priority: string | null;
  /** The workspace's work item type; null for a native item from before types (shown as Task). */
  type_id: string | null;
  issue_type: string | null;
  issue_type_id?: string | null;
  reporter: { id: string | null; name: string | null } | null;
  labels: string[];
  parent: { key: string | null; title: string | null } | null;
  /** ISO date, e.g. 2026-10-20. */
  due_date: string | null;
  story_points: number | null;
  subtasks: LinkedItem[];
  links: LinkedItem[];
  target_key: string | null;
  external_url: string | null;
  /** False when the tracker grant predates write-back: reconnect it to edit. */
  editable: boolean;
  created_at: string;
  updated_at: string;
};

export type LinkedItem = { key: string | null; title: string | null; status: string | null; status_category: StatusCategory | null; type?: string | null };

export type WorkItemFields = { title: string; description: string | null; assignee_id: string | null };

/** Fields the ticket view edits one at a time. */
export type WorkItemChanges = Partial<WorkItemFields & { priority: string | null; labels: string[]; due_date: string | null; story_points: number | null; type_id: string }>;

export type Comment = {
  id: string;
  author: { id: string | null; name: string | null };
  /** Markdown. */
  body: string;
  created_at: string | null;
  updated_at: string | null;
  editable: boolean;
  deletable: boolean;
};

export type CreateWorkItem = WorkItemFields & { board_id: string; column_id: string; sprint_id: string | null; type_id: string | null };

export type MoveWorkItem = { column_id: string; before_id: string | null; after_id: string | null; status_id?: string | null };

export const COLUMN_MODE = { default: 'default', tracker: 'tracker' } as const;
export const COLUMN_PROMPT = { none: 'none', pending: 'pending', dismissed: 'dismissed' } as const;

export const COLUMN_COLOR = {
  gray: 'gray',
  blue: 'blue',
  green: 'green',
  red: 'red',
  amber: 'amber',
  purple: 'purple',
  orange: 'orange',
  slate: 'slate',
} as const;
export type ColumnColor = (typeof COLUMN_COLOR)[keyof typeof COLUMN_COLOR];

/** `color` is the board's override; null means the default for its name and category (see `columnColor`). */
export type Column = {
  id: string;
  name: string;
  status_category: StatusCategory;
  color?: ColumnColor | null;
  /** The tracker statuses it holds; empty on boards that place items by category. */
  status_ids?: string[];
  /** Native boards: the columns a card can move to from here; null (or absent) for any. */
  next?: string[] | null;
};

/** A tracker's workflows, for hints while dragging; the tracker still decides each move. */
export type TrackerWorkflow = {
  statuses: Record<string, { name: string; category: StatusCategory }>;
  /** `from` null: from any status (a global transition). */
  workflows: Record<string, { name: string | null; transitions: { id: string; name: string; from: string[] | null; to: string }[] }>;
  by_issue_type: Record<string, string>;
};

/** One place a card can land: a column, and on a tracker board the status (and named move) that takes it there. */
export type MoveTarget = { column_id: string; status_id: string | null; status: string | null; transition_name: string | null };

/** Where an item can move: `open` boards allow any column; `live` is the tracker's answer for the item now. */
export type AllowedMoves = { basis: 'open' | 'board' | 'live'; targets: MoveTarget[] };

export const PRIORITY_LEVEL = { highest: 'highest', high: 'high', medium: 'medium', low: 'low', lowest: 'lowest' } as const;
export type PriorityLevel = (typeof PRIORITY_LEVEL)[keyof typeof PRIORITY_LEVEL];

export type Board = {
  id: string;
  /** NATIVE_SOURCE for the Overwatch board, otherwise the tracker it mirrors. */
  source: string;
  target_key: string | null;
  name: string;
  kind: 'scrum' | 'kanban';
  column_mode: (typeof COLUMN_MODE)[keyof typeof COLUMN_MODE];
  columns: Column[];
  /** The tracker's columns on offer to an admin; `columns` is empty until a full sync has read them. */
  column_prompt: { status: (typeof COLUMN_PROMPT)[keyof typeof COLUMN_PROMPT]; columns: string[] };
  /** False when the tracker grant can't write back. */
  editable: boolean;
  /** The tracker's workflows, once a full sync could read them. */
  workflow?: TrackerWorkflow | null;
};

export type Tracker = {
  provider: string;
  name: string;
  status: ConnectionStatus;
  can_write: boolean;
  targets: SyncTarget[];
};

/** A tracker project's sync with its tracker; null `last_synced_at` until its first sync. */
export type SyncTarget = { key: string; name: string | null; sync_status: JobStatus; sync_error: string | null; last_synced_at: string | null };

export type Person = { id: string; name: string; avatar_url: string | null };

export const BOARD_KIND = { scrum: 'scrum', kanban: 'kanban' } as const;
export const SPRINT_STATE = { future: 'future', active: 'active', closed: 'closed' } as const;

export type Sprint = {
  id: string;
  board_id: string;
  name: string;
  state: (typeof SPRINT_STATE)[keyof typeof SPRINT_STATE];
  goal: string | null;
  start_at: string | null;
  end_at: string | null;
  completed_at: string | null;
};

export type SprintFields = { name?: string; goal?: string | null; start_at?: string | null; end_at?: string | null };

/** What the board shows: the active sprint, a chosen one, or (kanban boards) everything current. */
export const CURRENT_SPRINT = 'current';
