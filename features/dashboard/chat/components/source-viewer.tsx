'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { Dialog, DialogContent } from '@/shared/components/dialog';
import GithubMark from '@/shared/components/github-mark';
import Spinner from '@/shared/components/spinner';
import { useSource } from '../hooks';
import { githubLineUrl, lineRange } from '../lib';
import type { CodeCitation } from '../types';
import CodeLines from './code-lines';

type SourceViewerProps = {
  repo: string;
  citation: CodeCitation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** The whole file a citation is from, as of the commit it was cited at, scrolled to its lines. */
export default function SourceViewer({ repo, citation, open, onOpenChange }: SourceViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={<span className="font-mono text-sm break-all">{citation.path}</span>}
        description={`Lines ${lineRange(citation)} · commit ${citation.commit_sha.slice(0, 7)}`}
        className="flex h-[85vh] max-w-4xl flex-col"
        footer={
          <Button asChild size="sm">
            <a href={githubLineUrl(repo, citation)} target="_blank" rel="noopener noreferrer">
              <GithubMark /> View on GitHub
            </a>
          </Button>
        }
      >
        {open && <SourceBody repo={repo} citation={citation} />}
      </DialogContent>
    </Dialog>
  );
}

function SourceBody({ repo, citation }: { repo: string; citation: CodeCitation }) {
  const source = useSource(repo, citation.path, citation.commit_sha);

  if (source.isPending) {
    return <Spinner className="mx-auto mt-10 size-5 text-muted" />;
  }
  if (source.isError) {
    return (
      <Banner type="warning">
        This file isn&apos;t available here any more, usually because the repository has moved on.
        It&apos;s still on GitHub at the same commit.
      </Banner>
    );
  }
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {!source.data.is_current && (
        <Banner className="text-xs">
          The repository has changed since this answer. This is the file as it was then.
        </Banner>
      )}
      <CodeLines
        code={source.data.content}
        startLine={1}
        language={source.data.language}
        marked={{ start: citation.start_line, end: citation.end_line }}
        scrollToMarked
        className="min-h-0 flex-1 rounded-md border border-border bg-background"
      />
      {source.data.truncated && (
        <p className="text-xs text-muted">
          Showing {source.data.content.split('\n').length.toLocaleString()} of{' '}
          {source.data.line_count.toLocaleString()} lines. The rest is on GitHub.
        </p>
      )}
    </div>
  );
}
