'use client';

import { toApiError } from '@/shared/api/envelope';
import Avatar from '@/shared/components/avatar';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Skeleton from '@/shared/components/skeleton';
import { cn } from '@/shared/lib/cn';
import { timeAgo } from '@/shared/lib/time';
import { ArrowsClockwise, ArrowSquareOut, BookOpenText } from '@phosphor-icons/react/ssr';
import type { Editor } from '@tiptap/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as docsApi from '../api';
import { useCreateDocument, useResolveConflict, useStoreSaved } from '../hooks';
import { insertImages } from '../insert-images';
import {
  createAutosave,
  readingMinutes,
  SAVE_STATUS,
  type SaveStatus,
  sourceName,
  syncLabel,
  withImageLinks,
} from '../lib';
import {
  CONFLICT_ACTION,
  type ConflictAction,
  type Document,
  DOCUMENT_KIND,
  NATIVE_SOURCE,
  PUSH_STATE,
} from '../types';
import EditorToolbar from './editor-toolbar';
import TitleInput from './title-input';

const DocEditor = dynamic(() => {
  return import('./doc-editor');
}, {
  ssr: false,
  loading: () => {
    return <Skeleton className="h-64 w-full" />;
  },
});

const SAVE_DELAY = 1500;
const RETRY_DELAY = 5000;
const CONFLICT = 'doc_conflict';

const STATUS_LABEL: Record<SaveStatus, string> = {
  [SAVE_STATUS.saved]: 'Saved',
  [SAVE_STATUS.dirty]: 'Unsaved changes',
  [SAVE_STATUS.saving]: 'Saving…',
  [SAVE_STATUS.conflict]: 'Not saved',
  [SAVE_STATUS.error]: "Couldn't save, retrying…",
};

const seedOf = (doc: Document) => {
  return withImageLinks(doc.content ?? { type: 'doc', content: [] }, doc.attachment_urls);
};

/**
 * A page: its title, and a body saved as it's written; a save never overwrites someone else's.
 * A page mirrored from a source (Confluence) is saved here the same way and sent there once the
 * edits settle; if the source changed too, its version is shown and the user picks.
 */
export default function DocPage({ doc }: { doc: Document }) {
  // bumped to load another version into a fresh editor (after "Use theirs")
  const [seed, setSeed] = useState({ content: seedOf(doc), key: 0 });
  const mirrored = doc.source !== NATIVE_SOURCE;
  const [status, setStatus] = useState<SaveStatus>(SAVE_STATUS.saved);
  const editor = useRef<Editor | null>(null);
  // the same editor, as state, for the toolbar to render against
  const [toolbarEditor, setToolbarEditor] = useState<Editor | null>(null);
  const baseVersion = useRef(doc.version);
  const storeSaved = useStoreSaved();

  const autosave = useMemo(
    () => {
      return createAutosave({
        delay: SAVE_DELAY,
        retryDelay: RETRY_DELAY,
        save: async () => {
          const current = editor.current;
          if (!current) {
            return;
          }
          const saved = await docsApi.saveContent({
            id: doc.id,
            content: current.getJSON(),
            content_md: current.getMarkdown(),
            base_version: baseVersion.current,
          });
          baseVersion.current = saved.version;
          storeSaved(saved);
        },
        isConflict: (error) => {
          return toApiError(error).errorCode === CONFLICT;
        },
        onStatus: setStatus,
      });
    },
    // one queue per page and per loaded version
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc.id, seed.key],
  );

  // leaving or hiding the page saves at once; closing the tab with unsaved changes asks first
  useEffect(() => {
    const onHide = () => {
      return document.visibilityState === 'hidden' && void autosave.flush();
    };
    const onUnload = (event: BeforeUnloadEvent) => {
      return autosave.hasUnsaved() && event.preventDefault();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onUnload);
      void autosave.flush();
      autosave.dispose();
    };
  }, [autosave]);

  const keepMine = async () => {
    const latest = await docsApi.getDocument(doc.id);
    baseVersion.current = latest.version;
    await autosave.resume();
  };
  const load = (latest: Document) => {
    baseVersion.current = latest.version;
    storeSaved(latest);
    setStatus(SAVE_STATUS.saved);
    setSeed((previous) => {
      return { content: seedOf(latest), key: previous.key + 1 };
    });
  };
  const loadTheirs = async () => {
    return load(await docsApi.getDocument(doc.id));
  };

  // the source changed while our edits were on their way: its version is now the page's, so show it
  useEffect(() => {
    if (doc.push_state !== PUSH_STATE.conflict || doc.version === baseVersion.current) {
      return;
    }
    baseVersion.current = doc.version;
    setSeed((previous) => {
      return { content: seedOf(doc), key: previous.key + 1 };
    });
  }, [doc]);

  return (
    <div
      className="flex min-h-full flex-col"
      onBlur={() => {
        return void autosave.flush();
      }}
    >
      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-background/95 px-6 pt-3 pb-2 backdrop-blur">
        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <Breadcrumbs doc={doc} />
          <span className="flex shrink-0 items-center gap-3">
            {doc.editable && <span aria-live="polite">{STATUS_LABEL[status]}</span>}
            {doc.external_url && (
              <a
                href={doc.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                Open in {sourceName(doc.source)} <ArrowSquareOut aria-hidden className="size-3.5" />
              </a>
            )}
          </span>
        </div>
        {doc.editable && toolbarEditor && (
          <EditorToolbar
            editor={toolbarEditor}
            onImages={mirrored ? undefined : (files) => {
              return insertImages(toolbarEditor, doc.id, files);
            }}
          />
        )}
      </div>
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-8">
        {doc.conflict && <SourceConflict doc={doc} onResolved={load} />}
        {status === SAVE_STATUS.conflict && (
          <Banner
            type="warning"
            action={
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    return void loadTheirs();
                  }}
                >
                  Use theirs
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    return void keepMine();
                  }}
                >
                  Keep mine
                </Button>
              </div>
            }
          >
            Someone else saved this page while you were editing. Keep your version, or load theirs
            (your edits are dropped).
          </Banner>
        )}
        <div className="flex flex-col gap-3">
          <TitleInput
            key={seed.key}
            doc={doc}
            onEnter={() => {
              return editor.current?.commands.focus('start');
            }}
          />
          <PageDetails doc={doc} />
        </div>
        <DocEditor
          key={seed.key}
          initial={seed.content}
          editable={doc.editable}
          onEditor={(current) => {
            editor.current = current;
            setToolbarEditor(current);
          }}
          onChange={autosave.change}
          onImages={(files, at) => {
            if (mirrored) {
              toast.error(
                `Images can't be added to ${sourceName(doc.source)} pages from here yet.`,
              );
            } else if (editor.current) {
              insertImages(editor.current, doc.id, files, at);
            }
          }}
          sourceName={sourceName(doc.source)}
        />
      </article>
    </div>
  );
}

/** The page changed at its source while edits made here were on their way: the source's version is shown. */
function SourceConflict(
  { doc, onResolved }: { doc: Document; onResolved: (doc: Document) => void },
) {
  const router = useRouter();
  const resolve = useResolveConflict();
  const create = useCreateDocument();
  const name = sourceName(doc.source);
  const conflict = doc.conflict;
  if (!conflict) {
    return null;
  }

  const settle = (action: ConflictAction) => {
    return resolve.mutate({ id: doc.id, action, base_version: doc.version }, {
      onSuccess: onResolved,
    });
  };
  // a copy of ours as a page of its own here, then theirs stays
  const copyMine = () => {
    return create.mutate(
      {
        kind: DOCUMENT_KIND.page,
        title: `${conflict.title} (my version)`,
        content: conflict.content,
        content_md: conflict.content_md ?? '',
      },
      {
        onSuccess: (copy) => {
          toast.success('Your version was saved as a new page.', {
            action: {
              label: 'Open',
              onClick: () => {
                return router.push(`/documents/${copy.id}`);
              },
            },
          });
          settle(CONFLICT_ACTION.keepSource);
        },
      },
    );
  };

  return (
    <Banner
      type="warning"
      action={
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            loading={resolve.isPending}
            onClick={() => {
              return settle(CONFLICT_ACTION.keepSource);
            }}
          >
            Keep {name}&apos;s
          </Button>
          <Button size="sm" loading={create.isPending} onClick={copyMine}>
            Copy mine to a new page
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={resolve.isPending}
            onClick={() => {
              return settle(CONFLICT_ACTION.overwrite);
            }}
          >
            Overwrite with mine
          </Button>
        </div>
      }
    >
      This page changed in {name} while your edits were on their way, so{' '}
      {name}&apos;s version is shown. Your version is kept until you choose.
    </Banner>
  );
}

const fullDate = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

/** Under the title, as Confluence shows it: who wrote it, how long it takes to read, when it was made and changed. */
function PageDetails({ doc }: { doc: Document }) {
  const sync = syncLabel(doc);
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {doc.author && (
        <span className="flex items-center gap-1.5">
          <Avatar
            src={doc.author.avatar_url}
            name={doc.author.name ?? ''}
            size="sm"
            className="size-5 text-[9px]"
          />
          By {doc.author.name ?? 'someone'}
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <BookOpenText aria-hidden className="size-3.5" />
        {readingMinutes(doc.content_md)} min read
      </span>
      <time dateTime={doc.created_at} title={fullDate.format(new Date(doc.created_at))}>
        Created {timeAgo(doc.created_at)}
      </time>
      <time dateTime={doc.updated_at} title={fullDate.format(new Date(doc.updated_at))}>
        Updated {timeAgo(doc.updated_at)}
      </time>
      {sync && (
        <span className={cn('flex items-center gap-1.5', doc.push_error && 'text-warning-strong')}>
          <ArrowsClockwise aria-hidden className="size-3.5" />
          {sync}
        </span>
      )}
    </p>
  );
}

function Breadcrumbs({ doc }: { doc: Document }) {
  if (!doc.breadcrumbs.length) {
    return <span />;
  }
  return (
    <nav aria-label="Breadcrumb" className="min-w-0 truncate">
      {doc.breadcrumbs.map((crumb, index) => {
        return (
          <span key={crumb.id}>
            {index > 0 && <span className="px-1.5">/</span>}
            <Link href={`/documents/${crumb.id}`} className="hover:text-foreground">
              {crumb.title || 'Untitled'}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
