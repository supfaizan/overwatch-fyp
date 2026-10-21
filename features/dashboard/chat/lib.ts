import { API_URL } from '@/shared/api/envelope';
import type { ChatMessage, Mention, NodeRef } from './types';

export type Segment = { type: 'text'; text: string } | { type: 'node'; node: NodeRef };

/** A cited node in an answer's markdown becomes an inline code span holding this, which renders as a chip. */
export const CHIP_RE = /^⟦(n\d+)⟧$/;
const chip = (ref: string) => {
  return `\`⟦${ref}⟧\``;
};
// fenced code is left alone: a reference never belongs inside code
const FENCE_RE = /(```[\s\S]*?(?:```|$))/;

/**
 * An answer's markdown with its `[nX]` references turned into chips. The model writes `login [n4]`
 * (or `` `login` [n4] ``, `**login** [n4]`); the name already there becomes the chip, so it reads once.
 */
export function answerMarkdown(message: ChatMessage): string {
  const names = new Map(
    message.nodes.flatMap((node) => {
      return (node.ref ? [[node.ref, node.name] as const] : []);
    }),
  );
  return message.text
    .split(FENCE_RE)
    .map((part, index) => {
      return (index % 2 === 1 ? part : chipRefs(part, names));
    })
    .join('');
}

function chipRefs(text: string, names: Map<string, string>): string {
  let out = '';
  let last = 0;
  for (const match of text.matchAll(/[ \t]?\[(n\d+)\]/g)) {
    let before = out + text.slice(last, match.index);
    last = match.index + match[0].length;
    const name = names.get(match[1]);
    // the backend drops unknown refs; this only guards a stale message
    if (!name) {
      out = before;
      continue;
    }
    const shown = [`**${name}**`, `\`${name}\``, `*${name}*`, name].find((form) => {
      return before.endsWith(form);
    });
    if (shown) {
      before = before.slice(0, -shown.length);
    } else if (before && !/\s$/.test(before)) {
      before += ' ';
    }
    out = before + chip(match[1]);
  }
  return out + text.slice(last);
}

/** A question's text with its @-mentions as chips. */
export function questionSegments(message: ChatMessage): Segment[] {
  const mentions = message.nodes.filter((node) => {
    return !node.ref;
  });
  if (mentions.length === 0) {
    return [{ type: 'text', text: message.text }];
  }

  // longest first, so `@user_service` isn't read as `@user` + `_service`
  const names = [
    ...new Set(mentions.map((node) => {
      return node.name;
    })),
  ].sort((a, b) => {
    return b.length - a.length;
  });
  const pattern = new RegExp(`@(${names.map(escapeRegExp).join('|')})`, 'g');
  const segments: Segment[] = [];
  let last = 0;
  for (const match of message.text.matchAll(pattern)) {
    const node = mentions.find((mention) => {
      return mention.name === match[1];
    });
    if (!node) {
      continue;
    }
    pushText(segments, message.text.slice(last, match.index));
    last = match.index + match[0].length;
    segments.push({ type: 'node', node });
  }
  pushText(segments, message.text.slice(last));
  return segments;
}

function pushText(segments: Segment[], text: string) {
  if (text) {
    segments.push({ type: 'text', text });
  }
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The `@term` being typed at the caret, if any: what to search the graph for. */
export function mentionQuery(text: string, caret: number): { term: string; start: number } | null {
  const match = /(?:^|\s)@([\w.$-]*)$/.exec(text.slice(0, caret));
  if (!match) {
    return null;
  }
  return { term: match[1], start: caret - match[1].length - 1 };
}

/** The mentions still present in the text: deleting `@name` drops its node too. */
export function keptMentions(text: string, mentions: Mention[]): Mention[] {
  const seen = new Set<string>();
  return mentions.filter((mention) => {
    if (
      seen.has(mention.nodeId)
      || !new RegExp(`@${escapeRegExp(mention.name)}(?![\\w.$-])`).test(text)
    ) {
      return false;
    }
    seen.add(mention.nodeId);
    return true;
  });
}

/** Where chat attachments are served on the API; the backend keeps answer images to this path too. */
const ATTACHMENT_PATH = '/chat/attachments/';
const INLINE_IMAGE_RE = /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/;

/**
 * The URL to load an image from, or null to not load it. Only our own attachments (a path relative
 * to the API, or the API's absolute URL) and inline raster data: anything else would let text quoted
 * from a repository make the viewer's browser contact another server.
 */
export function safeImageSrc(src: unknown): string | null {
  if (typeof src !== 'string') {
    return null;
  }
  if (INLINE_IMAGE_RE.test(src)) {
    return src;
  }
  const base = API_URL.replace(/\/$/, '');
  try {
    // resolving normalises `..`, so a path can't climb out of the attachments folder
    const url = new URL(src.startsWith(ATTACHMENT_PATH) ? base + src : src);
    return url.href.startsWith(new URL(base + ATTACHMENT_PATH).href) ? url.href : null;
  } catch {
    return null;
  }
}
