import type { JSONContent } from '@tiptap/react';

export const DOCUMENT_KIND = { folder: 'folder', page: 'page' } as const;
export type DocumentKind = (typeof DOCUMENT_KIND)[keyof typeof DOCUMENT_KIND];

/** A tree row: everything but the content. */
export type DocumentSummary = {
  id: string;
  kind: DocumentKind;
  title: string;
  parent_id: string | null;
  rank: number;
  has_children: boolean;
  /** `native`, or the docs provider it's mirrored from */
  source: string;
  editable: boolean;
  /** Pages can be created inside it; inside a mirrored node they're created at its source. */
  can_add_pages: boolean;
  /** The node at its source; null for docs written here. */
  external_url: string | null;
  updated_at: string;
};

export const NATIVE_SOURCE = 'native';

/** Where a mirrored page's edits are on their way back to its source. */
export const PUSH_STATE = { none: 'none', pending: 'pending', pushing: 'pushing', conflict: 'conflict' } as const;
export type PushState = (typeof PUSH_STATE)[keyof typeof PUSH_STATE];

export type Document = DocumentSummary & {
  /** The editor's document; null for folders. */
  content: JSONContent | null;
  content_md: string | null;
  /** Send back as `base_version` with the next content save. */
  version: number;
  breadcrumbs: { id: string; title: string }[];
  /** Who created it, as they were named then; null for pages from before authors were kept. */
  author: { id: string; name: string | null; avatar_url: string | null } | null;
  created_at: string;
  /** Signed links to the page's uploaded images, by attachment id; they expire, so a reload gets fresh ones. */
  attachment_urls: Record<string, string>;
  /** Null for pages written here. */
  push_state: PushState | null;
  /** Why the last push to the source didn't go through; it's retried. */
  push_error: string | null;
  /** When the source's content was last read or written. */
  synced_at: string | null;
  /** What was saved here while the source changed too, kept until it's resolved. */
  conflict: { title: string; content: JSONContent; content_md: string | null } | null;
};

export type CreateDocument = { kind: DocumentKind; title?: string; parent_id?: string | null; content?: JSONContent; content_md?: string };

export const CONFLICT_ACTION = { keepSource: 'keep_source', overwrite: 'overwrite' } as const;
export type ConflictAction = (typeof CONFLICT_ACTION)[keyof typeof CONFLICT_ACTION];

export type ContentSave = { content: JSONContent; content_md: string; base_version: number };

/** One level of the tree, a run at a time. */
export type ChildPage = { nodes: DocumentSummary[]; total: number; offset: number };

/** An Archive entry: archived on its own, with `archived_with` more nodes that went with it. */
export type ArchivedDocument = {
  id: string;
  kind: DocumentKind;
  title: string;
  archived_with: number;
  archived_at: string;
  archived_by: string | null;
  source: string;
};

/** How to send a file, exactly as the backend says: a signed form (`fields`), a signed PUT (`headers`), or our API. */
export type UploadTarget = { method: string; url: string; fields: Record<string, string>; headers: Record<string, string>; via_api: boolean };

/** What's known about a link; any of it may be missing, and its card falls back to the address. */
export type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  site_name: string | null;
  icon_url: string | null;
  image_url: string | null;
};

/** How a link shows in a page: a chip in the line, a card, or playing in place (the editor's node names). */
export const CARD_KIND = { inline: 'inlineCard', block: 'blockCard', embed: 'embedCard' } as const;
export type CardKind = (typeof CARD_KIND)[keyof typeof CARD_KIND];
