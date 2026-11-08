'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { Dialog, DialogContent } from '@/shared/components/dialog';
import GithubMark from '@/shared/components/github-mark';
import Spinner from '@/shared/components/spinner';
import { useSource } from '../hooks';
import { githubFileUrl, githubLineUrl, lineRange } from '../lib';
import CodeLines from './code-lines';

type Lines = { start: number; end: number };

type SourceViewerProps = {
  repo: string;
  path: string;
  commitSha: string;
  /** the lines to mark and scroll to, e.g. what an answer cites or where a symbol is defined */
  lines?: Lines;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** A whole file as of a commit, scrolled to `lines` when given. */
export default function SourceViewer(
  { repo, path, commitSha, lines, open, onOpenChange }: SourceViewerProps,
) {
  const commit = `commit ${commitSha.slice(0, 7)}`;
  const github = lines
    ? githubLineUrl(repo, {
      path,
      commit_sha: commitSha,
      start_line: lines.start,
      end_line: lines.end,
    })
    : githubFileUrl(repo, commitSha, path);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={<span className="font-mono text-sm break-all">{path}</span>}
        description={lines
          ? `Lines ${lineRange({ start_line: lines.start, end_line: lines.end })} · ${commit}`
          : commit}
        className="flex h-[85vh] max-w-5xl flex-col"
        footer={
          <Button asChild size="sm">
            <a href={github} target="_blank" rel="noopener noreferrer">
              <GithubMark /> View on GitHub
            </a>
          </Button>
        }
      >
        {open && <SourceBody repo={repo} path={path} commitSha={commitSha} lines={lines} />}
      </DialogContent>
    </Dialog>
  );
}

// TODO: render files like a GitHub review diff: by default show a good stretch of code above and below
// the marked lines, and let the reader expand to fetch the rest as needed. Useful for files too big to
// show whole; still to decide is how a bigger file is fetched: all at once, or in parts on use.
function SourceBody(
  { repo, path, commitSha, lines }: Pick<
    SourceViewerProps,
    'repo' | 'path' | 'commitSha' | 'lines'
  >,
) {
  const source = useSource(repo, path, commitSha);

  if (source.isPending) {
    return <Spinner className="mx-auto mt-10 size-5 text-muted" />;
  }
  if (source.isError) {
    return (
      <Banner type="warning">
        This file can&apos;t be shown here: it may be binary, over 1 MB, or no longer in the
        repository at this commit. It&apos;s still on GitHub.
      </Banner>
    );
  }
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {!source.data.is_current && (
        <Banner className="text-xs">
          The repository has changed since this commit. This is the file as it was then.
        </Banner>
      )}
      <CodeLines
        code={source.data.content}
        startLine={1}
        language={source.data.language}
        marked={lines}
        scrollToMarked={lines !== undefined}
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
