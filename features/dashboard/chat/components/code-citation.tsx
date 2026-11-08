'use client';

import Button from '@/shared/components/button';
import Tooltip from '@/shared/components/tooltip';
import { ArrowsOut, Copy, FileCode } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import { toast } from 'sonner';
import { lineRange } from '../lib';
import type { CodeCitation as Citation } from '../types';
import CodeLines from './code-lines';
import SourceViewer from './source-viewer';

type CodeCitationProps = { repo: string; citation: Citation };

/**
 * The lines an answer cites, exactly as in the file, shown where the answer cites them; they can be
 * copied or read in context, where GitHub is a click away.
 */
export default function CodeCitation({ repo, citation }: CodeCitationProps) {
  const [viewing, setViewing] = useState(false);

  return (
    <figure className="overflow-hidden rounded-md border border-border bg-background">
      <figcaption className="flex items-center gap-1.5 border-b border-border py-1 pr-1 pl-2.5 text-xs">
        <FileCode className="size-3.5 shrink-0 text-muted" aria-hidden />
        <Tooltip content={`${citation.path} at ${citation.commit_sha.slice(0, 7)}`}>
          <span className="min-w-0 truncate font-mono">{citation.path}</span>
        </Tooltip>
        <span className="shrink-0 text-muted">L{lineRange(citation)}</span>
        <span className="ml-auto flex shrink-0">
          <Button
            variant="tertiary"
            size="sm"
            iconOnly
            aria-label="Copy these lines"
            className="size-7"
            onClick={() => {
              return copy(citation.code);
            }}
          >
            <Copy />
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            iconOnly
            aria-label="Open the file at these lines"
            className="size-7"
            onClick={() => {
              return setViewing(true);
            }}
          >
            <ArrowsOut />
          </Button>
        </span>
      </figcaption>
      <CodeLines
        code={citation.code}
        startLine={citation.start_line}
        language={citation.language}
        className="max-h-48"
      />
      <SourceViewer
        repo={repo}
        path={citation.path}
        commitSha={citation.commit_sha}
        lines={{ start: citation.start_line, end: citation.end_line }}
        open={viewing}
        onOpenChange={setViewing}
      />
    </figure>
  );
}

function copy(code: string) {
  navigator.clipboard.writeText(code).then(
    () => {
      return toast.success('Lines copied.');
    },
    () => {
      return toast.error('Could not copy the lines.');
    },
  );
}
