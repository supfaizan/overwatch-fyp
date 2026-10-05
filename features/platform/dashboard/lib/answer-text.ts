/* Reading an answer's text into pieces the chat can render safely.

   Answers are plain prose with the markup the model is asked for or tends to
   use: `code`, **emphasis**, `[12]` citations of nodes, and fenced blocks of
   quoted source. They are turned into tokens, never into HTML, so nothing in
   an answer — which quotes someone else's repository — can inject markup. */

export type AnswerToken =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "cite"; number: number };

const MARKUP = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|\[(\d{1,4})\]/g;

/** One line of an answer as tokens, in order. */
export function tokenizeLine(line: string): AnswerToken[] {
  const tokens: AnswerToken[] = [];
  let last = 0;
  for (const match of line.matchAll(MARKUP)) {
    const start = match.index ?? 0;
    if (start > last) tokens.push({ kind: "text", text: line.slice(last, start) });
    const [, code, strong, cite] = match;
    if (code !== undefined) tokens.push({ kind: "code", text: code });
    else if (strong !== undefined) tokens.push({ kind: "strong", text: strong });
    else tokens.push({ kind: "cite", number: Number(cite) });
    last = start + match[0].length;
  }
  if (last < line.length) tokens.push({ kind: "text", text: line.slice(last) });
  return tokens;
}

/** A run of prose, or a block of quoted code (shown verbatim). */
export type AnswerBlock =
  | { kind: "prose"; lines: AnswerToken[][] }
  | { kind: "code"; language: string; text: string };

const FENCE = /^\s*```\s*([\w+#.-]*)\s*$/;

/** An answer as prose and code blocks, in order. An unclosed fence runs to
 *  the end, as a reader would take it. */
export function parseAnswer(answer: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  let prose: string[] = [];
  let code: { language: string; lines: string[] } | null = null;

  const flushProse = () => {
    // Blank lines hugging a code block are spacing, not paragraphs.
    while (prose.length > 0 && prose[prose.length - 1].trim() === "") prose.pop();
    if (prose.length > 0) blocks.push({ kind: "prose", lines: prose.map(tokenizeLine) });
    prose = [];
  };

  for (const line of answer.split("\n")) {
    const fence = FENCE.exec(line);
    if (code) {
      if (fence && fence[1] === "") {
        blocks.push({ kind: "code", language: code.language, text: code.lines.join("\n") });
        code = null;
      } else {
        code.lines.push(line);
      }
    } else if (fence) {
      flushProse();
      code = { language: fence[1], lines: [] };
    } else if (prose.length > 0 || line.trim() !== "") {
      prose.push(line);
    }
  }
  if (code) blocks.push({ kind: "code", language: code.language, text: code.lines.join("\n") });
  flushProse();
  return blocks;
}
