// mirrors the backend schemas (app/work_items, app/connectors)

import type { ConnectionStatus } from '@/shared/connections/constants';

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
  /** The tracker's own status name; null for native items. */
  status: string | null;
  status_category: StatusCategory;
  rank: number;
  assignee: { id: string | null; name: string | null } | null;
  priority: string | null;
  issue_type: string | null;
  target_key: string | null;
  external_url: string | null;
  /** False when the tracker grant predates write-back: reconnect it to edit. */
  editable: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkItemFields = { title: string; description: string | null; assignee_id: string | null };

export type CreateWorkItem = WorkItemFields & {
  status_category: StatusCategory;
  provider: string | null;
  target_key: string | null;
};

export type MoveWorkItem = { status_category: StatusCategory; before_id: string | null; after_id: string | null };

export type Tracker = {
  provider: string;
  name: string;
  status: ConnectionStatus;
  can_write: boolean;
  targets: { key: string; name: string | null }[];
};

export type Person = { id: string; name: string; avatar_url: string | null };
