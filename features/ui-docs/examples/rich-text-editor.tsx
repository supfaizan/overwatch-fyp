'use client';

import Markdown from '@/shared/components/markdown';
import RichTextEditor from '@/shared/components/rich-text-editor';
import { useState } from 'react';

const START = `Type **Markdown** and it formats as you go: \`code\`, _italics_, lists and more.

- Start a line with \`- \` for a list
- or \`# \` for a heading`;

export function Default() {
  const [markdown, setMarkdown] = useState(START);
  return (
    <div className="flex flex-col gap-3">
      <RichTextEditor
        aria-label="Description"
        value={START}
        onChange={setMarkdown}
        placeholder="Describe the work…"
        className="max-h-64"
      />
      <p className="text-xs text-muted">The same text, as saved and rendered by Markdown:</p>
      <Markdown>{markdown}</Markdown>
    </div>
  );
}
