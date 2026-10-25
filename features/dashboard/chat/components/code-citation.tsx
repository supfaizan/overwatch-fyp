'use client';

import Button from '@/shared/components/button';
import GithubMark from '@/shared/components/github-mark';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { ArrowsOut, Copy, FileCode } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import { toast } from 'sonner';
import { githubLineUrl, lineRange } from '../lib';
import type { CodeCitation as Citation } from '../types';
import CodeLines from './code-lines';
import SourceViewer from './source-viewer';

type CodeCitationProps = {
  repo: string;
  citation: Citation;
  /** The id its inline chip points at. */
  id: string;
  /** Lit while its chip is pointed at. */
  active?: boolean;
};

/** The lines an answer cites, exactly as in the file, with ways to copy them or read them in context. */
export default function CodeCitation({ repo, citation, id, active = false }: CodeCitationProps) {
  const [viewing, setViewing] = useState(false);

  return (
    <figure
      id={id}
      className={cn(
        'scroll-mt-4 overflow-hidden rounded-md border bg-background transition-colors',
        active ? 'border-primary' : 'border-border',
      )}
    >
      <figcaption className="flex items-center gap-1.5 border-b border-border py-1 pr-1 pl-2.5 text-xs">
        <span className="font-mono text-muted">{citation.ref.slice(1)}</span>
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
          <Button variant="tertiary" size="sm" iconOnly asChild className="size-7">
            <a
              href={githubLineUrl(repo, citation)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View these lines on GitHub"
            >
              <GithubMark />
            </a>
          </Button>
        </span>
      </figcaption>
      <CodeLines
        code={citation.code}
        startLine={citation.start_line}
        language={citation.language}
        className="max-h-48"
      />
      <SourceViewer repo={repo} citation={citation} open={viewing} onOpenChange={setViewing} />
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
