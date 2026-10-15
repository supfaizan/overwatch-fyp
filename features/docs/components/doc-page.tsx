'use client';

import type { Editor } from '@tiptap/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toApiError } from '@/shared/api/envelope';
import { BookOpenText } from '@phosphor-icons/react/ssr';
import Avatar from '@/shared/components/avatar';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Skeleton from '@/shared/components/skeleton';
import * as docsApi from '../api';
import { useStoreSaved } from '../hooks';
import { insertImages } from '../insert-images';
import { SAVE_STATUS, type SaveStatus, createAutosave, readingMinutes, timeAgo, withImageLinks } from '../lib';
import type { Document } from '../types';
import EditorToolbar from './editor-toolbar';
import TitleInput from './title-input';

const DocEditor = dynamic(() => import('./doc-editor'), { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> });

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

/** A page: its title, and a body saved as it's written; a save never overwrites someone else's. */
export default function DocPage({ doc }: { doc: Document }) {
  // bumped to load another version into a fresh editor (after "Use theirs")
  const [seed, setSeed] = useState({ content: withImageLinks(doc.content ?? { type: 'doc', content: [] }, doc.attachment_urls), key: 0 });
  const [status, setStatus] = useState<SaveStatus>(SAVE_STATUS.saved);
  const editor = useRef<Editor | null>(null);
  // the same editor, as state, for the toolbar to render against
  const [toolbarEditor, setToolbarEditor] = useState<Editor | null>(null);
  const baseVersion = useRef(doc.version);
  const storeSaved = useStoreSaved();

  const autosave = useMemo(
    () =>
      createAutosave({
        delay: SAVE_DELAY,
        retryDelay: RETRY_DELAY,
        save: async () => {
          const current = editor.current;
          if (!current) return;
          const saved = await docsApi.saveContent({ id: doc.id, content: current.getJSON(), content_md: current.getMarkdown(), base_version: baseVersion.current });
          baseVersion.current = saved.version;
          storeSaved(saved);
        },
        isConflict: (error) => toApiError(error).errorCode === CONFLICT,
        onStatus: setStatus,
      }),
    // one queue per page and per loaded version
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc.id, seed.key],
  );

  // leaving or hiding the page saves at once; closing the tab with unsaved changes asks first
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && void autosave.flush();
    const onUnload = (event: BeforeUnloadEvent) => autosave.hasUnsaved() && event.preventDefault();
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
  const loadTheirs = async () => {
    const latest = await docsApi.getDocument(doc.id);
    baseVersion.current = latest.version;
    storeSaved(latest);
    setStatus(SAVE_STATUS.saved);
    setSeed((previous) => ({ content: withImageLinks(latest.content ?? { type: 'doc', content: [] }, latest.attachment_urls), key: previous.key + 1 }));
  };

  return (
    <div className="flex min-h-full flex-col" onBlur={() => void autosave.flush()}>
      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-background/95 px-6 pt-3 pb-2 backdrop-blur">
        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <Breadcrumbs doc={doc} />
          {doc.editable && <span aria-live="polite" className="shrink-0">{STATUS_LABEL[status]}</span>}
        </div>
        {doc.editable && toolbarEditor && <EditorToolbar editor={toolbarEditor} onImages={(files) => insertImages(toolbarEditor, doc.id, files)} />}
      </div>
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-8">
        {status === SAVE_STATUS.conflict && (
          <Banner
            type="warning"
            action={
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void loadTheirs()}>Use theirs</Button>
                <Button size="sm" variant="primary" onClick={() => void keepMine()}>Keep mine</Button>
              </div>
            }
          >
            Someone else saved this page while you were editing. Keep your version, or load theirs (your edits are dropped).
          </Banner>
        )}
        <div className="flex flex-col gap-3">
          <TitleInput doc={doc} onEnter={() => editor.current?.commands.focus('start')} />
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
          onImages={(files, at) => editor.current && insertImages(editor.current, doc.id, files, at)}
        />
      </article>
    </div>
  );
}

const fullDate = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

/** Under the title, as Confluence shows it: who wrote it, how long it takes to read, when it was made and changed. */
function PageDetails({ doc }: { doc: Document }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {doc.author && (
        <span className="flex items-center gap-1.5">
          <Avatar src={doc.author.avatar_url} name={doc.author.name ?? ''} size="sm" className="size-5 text-[9px]" />
          By {doc.author.name ?? 'someone'}
        </span>
      )}
      <span className="flex items-center gap-1.5"><BookOpenText aria-hidden className="size-3.5" />{readingMinutes(doc.content_md)} min read</span>
      <time dateTime={doc.created_at} title={fullDate.format(new Date(doc.created_at))}>Created {timeAgo(doc.created_at)}</time>
      <time dateTime={doc.updated_at} title={fullDate.format(new Date(doc.updated_at))}>Updated {timeAgo(doc.updated_at)}</time>
    </p>
  );
}

function Breadcrumbs({ doc }: { doc: Document }) {
  if (!doc.breadcrumbs.length) return <span />;
  return (
    <nav aria-label="Breadcrumb" className="min-w-0 truncate">
      {doc.breadcrumbs.map((crumb, index) => (
        <span key={crumb.id}>
          {index > 0 && <span className="px-1.5">/</span>}
          <Link href={`/documents/${crumb.id}`} className="hover:text-foreground">{crumb.title || 'Untitled'}</Link>
        </span>
      ))}
    </nav>
  );
}
