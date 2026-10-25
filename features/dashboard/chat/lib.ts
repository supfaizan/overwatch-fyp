import { API_URL } from '@/shared/api/envelope';
import type { AskResult, ChatMessage, CodeCitation, Mention, NodeRef } from './types';

export type Segment = { type: 'text'; text: string } | { type: 'node'; node: NodeRef };

/**
 * A cited node (`n4`) or code citation (`c1`) in an answer's markdown becomes an inline code span
 * holding this, which renders as a chip.
 */
export const CHIP_RE = /^⟦([nc]\d+)⟧$/;
const chip = (ref: string) => {
  return `\`⟦${ref}⟧\``;
};
// fenced code is left alone: a reference never belongs inside code
const FENCE_RE = /(```[\s\S]*?(?:```|$))/;

/**
 * Markdown from an answer (its text, or one of its steps) with its `[nX]` references and `[cN]` code
 * citations turned into chips. The model writes `login [n4]` (or `` `login` [n4] ``, `**login** [n4]`);
 * the name already there becomes the chip, so it reads once. A code citation stays where it is, as a
 * chip of its own.
 */
export function answerMarkdown(message: ChatMessage, text = message.text): string {
  const names = new Map<string, string>(
    message.nodes.flatMap((node) => {
      return (node.ref ? [[node.ref, node.name] as const] : []);
    }),
  );
  for (const citation of message.citations) {
    names.set(citation.ref, '');
  }
  return text
    .split(FENCE_RE)
    .map((part, index) => {
      return (index % 2 === 1 ? part : chipRefs(part, names));
    })
    .join('');
}

function chipRefs(text: string, names: Map<string, string>): string {
  let out = '';
  let last = 0;
  for (const match of text.matchAll(/[ \t]?\[([nc]\d+)\]/g)) {
    let before = out + text.slice(last, match.index);
    last = match.index + match[0].length;
    const name = names.get(match[1]);
    // the backend drops unknown refs; this only guards a stale message
    if (name === undefined) {
      out = before;
      continue;
    }
    const shown = !name
      ? undefined
      : [`**${name}**`, `\`${name}\``, `*${name}*`, name].find((form) => {
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

/** Where a citation's lines are on GitHub, pinned to the commit they were read at. */
export function githubLineUrl(
  repo: string,
  citation: Pick<CodeCitation, 'commit_sha' | 'path' | 'start_line' | 'end_line'>,
) {
  const path = citation.path.split('/').map(encodeURIComponent).join('/');
  const lines = citation.start_line === citation.end_line
    ? `L${citation.start_line}`
    : `L${citation.start_line}-L${citation.end_line}`;
  return `https://github.com/${repo}/blob/${citation.commit_sha}/${path}#${lines}`;
}

/** `42` or `42–58`, for a citation's label. */
export function lineRange(citation: Pick<CodeCitation, 'start_line' | 'end_line'>) {
  return citation.start_line === citation.end_line
    ? `${citation.start_line}`
    : `${citation.start_line}–${citation.end_line}`;
}

/** What `/chat/ask/stream` sends, piece by piece. */
export type AskStreamEvent =
  | { event: 'started'; data: Record<string, never> }
  | { event: 'thinking' | 'answer'; data: { text: string } }
  /** a lookup the model made while working the answer out, like "Reading SignupForm" */
  | { event: 'status'; data: { text: string } }
  | { event: 'done'; data: AskResult }
  | { event: 'error'; data: { error_code: string; message: string } };

/**
 * The complete server-sent events in `buffer`, and what's left of an event still arriving. Chunks
 * split anywhere, so a partial event waits for the next one.
 */
export function parseServerSent(buffer: string): { events: AskStreamEvent[]; rest: string } {
  const blocks = buffer.replaceAll('\r\n', '\n').split('\n\n');
  const rest = blocks.pop() ?? '';
  const events = blocks.flatMap((block) => {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data.push(line.slice(5).trimStart());
      }
    }
    try {
      return [{ event, data: JSON.parse(data.join('\n')) } as AskStreamEvent];
    } catch {
      return [];
    }
  });
  return { events, rest };
}

// the line a flow's steps start after, as the backend reads it (`STEPS:`, `**Steps:**`)
const STEPS_LINE_RE = /^[ \t*_#]*steps[ \t*_]*:[ \t*_]*$/gim;
// the sections a reply ends with (`FOLLOW_UPS:`, `ASK:`), shown as their own blocks once it's checked
// (any case for follow-ups; upper case only for `ASK`, as the backend reads them)
const TRAILING_SECTION_RE =
  /^[ \t*_#]*(?:[Ff](?:ollow|OLLOW)[ _-]?[Uu](?:ps|PS)[ \t*_]*:|ASK[ \t*_]*:)[\s\S]*$/m;

/**
 * An answer still being written, ready to show: its `[n4]` references and `[s3:42-58]` citations
 * (including one cut off at the end), header lines a model wrote late, the line its steps start
 * after and the follow-ups or question back it ends with are left out until the checked answer
 * replaces it.
 */
export function draftMarkdown(text: string): string {
  return text
    .replace(/^[ \t*_>#-]*(?:answerable|relations)[ \t*_]*:.*$/gim, '')
    .replace(TRAILING_SECTION_RE, '')
    .replace(STEPS_LINE_RE, '')
    .replace(/[ \t]?[[【]\s*(?:n\d+|s\d+\s*:[^\]】\n]*)[\]】]/g, '')
    .replace(/[ \t]?[[【]\s*(?:[ns]\d*(?:\s*:[^\]】\n]*)?)?$/, '');
}

/** The callouts an answer may use, as the backend writes their markers (`> [!WARNING]`). */
const CALLOUT_KIND = { note: 'NOTE', tip: 'TIP', warning: 'WARNING' } as const;
export type CalloutKind = keyof typeof CALLOUT_KIND;

/** An answer cut into what renders as Markdown and what renders as a callout. */
type AnswerBlock =
  | { type: 'markdown'; text: string }
  | { type: 'callout'; kind: CalloutKind; text: string };

const CALLOUT_START_RE = /^[ \t]*>[ \t]*\[!(NOTE|TIP|WARNING)\][ \t]*$/;
const QUOTE_LINE_RE = /^[ \t]*>[ \t]?/;

/**
 * Markdown split around its callouts: a `> [!KIND]` line and the quote lines after it become one
 * callout, without the `> `. Quotes inside fenced code are code, not callouts.
 */
export function answerBlocks(markdown: string): AnswerBlock[] {
  const kinds = new Map<string, CalloutKind>(
    Object.entries(CALLOUT_KIND).map(([kind, marker]) => {
      return [marker, kind as CalloutKind];
    }),
  );
  const blocks: AnswerBlock[] = [];
  let prose: string[] = [];
  let callout: { kind: CalloutKind; lines: string[] } | null = null;
  let fenced = false;
  const flush = () => {
    if (callout) {
      blocks.push({ type: 'callout', kind: callout.kind, text: callout.lines.join('\n').trim() });
      callout = null;
    }
    if (prose.join('').trim()) {
      blocks.push({ type: 'markdown', text: prose.join('\n').trim() });
    }
    prose = [];
  };
  for (const line of markdown.split('\n')) {
    if (line.trimStart().startsWith('```')) {
      fenced = !fenced;
    }
    const start = fenced ? null : CALLOUT_START_RE.exec(line);
    if (start) {
      flush();
      callout = { kind: kinds.get(start[1]) ?? 'note', lines: [] };
    } else if (callout && QUOTE_LINE_RE.test(line)) {
      callout.lines.push(line.replace(QUOTE_LINE_RE, ''));
    } else {
      if (callout) {
        flush();
      }
      prose.push(line);
    }
  }
  flush();
  return blocks;
}
