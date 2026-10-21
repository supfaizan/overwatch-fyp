import { timeAgo } from '@/shared/lib/time';
import { type Document, NATIVE_SOURCE, PUSH_STATE } from './types';

export const SAVE_STATUS = {
  saved: 'saved',
  /** edited, waiting for the pause that triggers a save */
  dirty: 'dirty',
  saving: 'saving',
  /** someone else saved first: autosave stops until the user picks a version */
  conflict: 'conflict',
  /** the save failed (offline, server error) and is retried */
  error: 'error',
} as const;
export type SaveStatus = (typeof SAVE_STATUS)[keyof typeof SAVE_STATUS];

type AutosaveOptions = {
  /** How long typing must pause before a save. */
  delay: number;
  /** How long to wait before retrying a failed save. */
  retryDelay: number;
  /** Saves the latest content; reads it itself, so a save always sends what's newest. */
  save: () => Promise<void>;
  isConflict: (error: unknown) => boolean;
  onStatus: (status: SaveStatus) => void;
};

/**
 * Saves after a pause in typing, one save at a time: edits made while a save is in flight are sent
 * by the next one, so nothing is lost and requests never overlap or arrive out of order.
 */
export function createAutosave({ delay, retryDelay, save, isConflict, onStatus }: AutosaveOptions) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let dirty = false;
  let saving = false;
  let stopped = false;

  const clear = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  const schedule = (after: number) => {
    clear();
    timer = setTimeout(flush, after);
  };

  async function flush(): Promise<void> {
    clear();
    // a save in flight sends this change when it finishes
    if (stopped || saving || !dirty) {
      return;
    }
    saving = true;
    dirty = false;
    onStatus(SAVE_STATUS.saving);
    try {
      await save();
      onStatus(dirty ? SAVE_STATUS.dirty : SAVE_STATUS.saved);
    } catch (error) {
      dirty = true;
      if (isConflict(error)) {
        stopped = true;
        onStatus(SAVE_STATUS.conflict);
      } else {
        onStatus(SAVE_STATUS.error);
        schedule(retryDelay);
      }
    } finally {
      saving = false;
    }
    if (dirty && !stopped && !timer) {
      schedule(delay);
    }
  }

  return {
    change() {
      if (stopped) {
        return;
      }
      dirty = true;
      onStatus(SAVE_STATUS.dirty);
      schedule(delay);
    },
    /** Save now, e.g. when the page is left or hidden. */
    flush,
    /** After a conflict, once the caller has rebased on the latest version: save what's here. */
    resume() {
      stopped = false;
      return flush();
    },
    hasUnsaved: () => {
      return dirty || saving;
    },
    dispose: clear,
  };
}

const TREE_COLLAPSED_KEY = 'ow_docs_tree_collapsed';

/** Whether the docs tree was left hidden; storage can be unavailable (private mode), which means shown. */
export function readTreeCollapsed(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(TREE_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveTreeCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(TREE_COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    // remembered for this visit only
  }
}

const WORDS_PER_MINUTE = 200;

/** Minutes to read Markdown at an average pace; at least one. */
export function readingMinutes(markdown: string | null): number {
  const words = markdown?.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

type ContentNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: ContentNode[];
  [key: string]: unknown;
};

/**
 * A page's content as it's opened: uploaded images get their fresh signed links, and an image whose
 * upload never finished (saved with only its local preview) is left out.
 */
export function withImageLinks<T extends ContentNode>(node: T, urls: Record<string, string>): T {
  if (!node.content) {
    return node;
  }
  const content = node.content.flatMap((child) => {
    if (child.type !== 'image') {
      return [withImageLinks(child, urls)];
    }
    const id = child.attrs?.attachmentId;
    if (typeof id === 'string') {
      return urls[id]
        ? [{ ...child, attrs: { ...child.attrs, src: urls[id], uploadId: null } }]
        : [];
    }
    return String(child.attrs?.src ?? '').startsWith('blob:') ? [] : [child];
  });
  return { ...node, content };
}

/** Images a page can take: what the backend accepts, at most 10 MB. */
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** An image's width, in percent of the page column; the keyboard resizes in steps (big steps with Shift). */
export const IMAGE_WIDTH = { min: 10, max: 100, step: 5, bigStep: 10 } as const;
/** The sizes the image menu offers; `null` is the image's own size, capped at the column. */
export const IMAGE_SIZE = { small: 25, medium: 50, full: 100, original: null } as const;
export const ALT_MAX_LENGTH = 250;

export function clampImageWidth(value: number): number {
  if (!Number.isFinite(value)) {
    return IMAGE_WIDTH.max;
  }
  return Math.min(IMAGE_WIDTH.max, Math.max(IMAGE_WIDTH.min, Math.round(value)));
}

/** Alt text as it's kept: one line, trimmed, capped; empty means the image is decorative. */
export function imageAlt(text: string): string | null {
  const alt = text.replace(/\s+/g, ' ').trim().slice(0, ALT_MAX_LENGTH).trim();
  return alt || null;
}

/** A new image's alt text: its file name without the extension. */
export function altFromFileName(name: string): string | null {
  return imageAlt(name.replace(/\.[^.]+$/, ''));
}

/** Alt text that can't end a markdown image early. */
export function markdownAlt(alt: string | null): string {
  return (alt ?? '').replace(/[\\[\]]/g, '\\$&');
}

// docs sources by their names as people know them; others show their id, capitalised
const SOURCE_NAMES: Record<string, string> = { confluence: 'Confluence' };

export const sourceName = (source: string) => {
  return SOURCE_NAMES[source] ?? source.charAt(0).toUpperCase() + source.slice(1);
};

/** How a mirrored page stands with its source, for under its title; null for pages written here. */
export function syncLabel(
  doc: Pick<Document, 'source' | 'push_state' | 'push_error' | 'synced_at'>,
  now = Date.now(),
): string | null {
  if (doc.source === NATIVE_SOURCE) {
    return null;
  }
  const name = sourceName(doc.source);
  if (doc.push_state === PUSH_STATE.conflict) {
    return `Changed in ${name} too`;
  }
  if (doc.push_state === PUSH_STATE.pending || doc.push_state === PUSH_STATE.pushing) {
    return doc.push_error
      ? `Not saved to ${name} yet: ${doc.push_error}`
      : `Saving to ${name} shortly`;
  }
  return doc.synced_at ? `Synced with ${name} ${timeAgo(doc.synced_at, now)}` : `From ${name}`;
}

/** A colour from a mirrored page, when it's a plain one (`#deebff`, `red`); anything else is dropped. */
export const plainColor = (value: unknown): string | undefined => {
  return typeof value === 'string' && /^(#[0-9a-f]{3,8}|[a-z]{3,20})$/i.test(value)
    ? value
    : undefined;
};
