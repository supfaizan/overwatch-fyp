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
  updated_at: string;
};

export type Document = DocumentSummary & {
  /** The editor's document; null for folders. */
  content: JSONContent | null;
  content_md: string | null;
  /** Send back as `base_version` with the next content save. */
  version: number;
  breadcrumbs: { id: string; title: string }[];
  external_url: string | null;
  /** Who created it, as they were named then; null for pages from before authors were kept. */
  author: { id: string; name: string | null; avatar_url: string | null } | null;
  created_at: string;
  /** Signed links to the page's uploaded images, by attachment id; they expire, so a reload gets fresh ones. */
  attachment_urls: Record<string, string>;
};

export type CreateDocument = { kind: DocumentKind; title?: string; parent_id?: string | null };

export type ContentSave = { content: JSONContent; content_md: string; base_version: number };

/** One level of the tree, a run at a time. */
export type ChildPage = { nodes: DocumentSummary[]; total: number; offset: number };

/** An Archive entry: archived on its own, with `archived_with` more nodes that went with it. */
export type ArchivedDocument = { id: string; kind: DocumentKind; title: string; archived_with: number; archived_at: string; archived_by: string | null };

/** How to send a file, exactly as the backend says: a signed form (`fields`), a signed PUT (`headers`), or our API. */
export type UploadTarget = { method: string; url: string; fields: Record<string, string>; headers: Record<string, string>; via_api: boolean };
