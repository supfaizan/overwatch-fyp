'use client';

import { cn } from '@/shared/lib/cn';
import { PencilSimple } from '@phosphor-icons/react/ssr';
import dynamic from 'next/dynamic';
import { type ReactNode, useState } from 'react';
import Button from './button';
import Markdown from './markdown';
import Skeleton from './skeleton';

// heavy, and only needed once someone edits
const RichTextEditor = dynamic(() => {
  return import('./rich-text-editor');
}, {
  ssr: false,
  loading: () => {
    return <Skeleton className="h-32 w-full" />;
  },
});

type EditableMarkdownProps = {
  /** The section's heading, also the editor's accessible name. */
  label: string;
  /** The saved Markdown; null or empty when there's none. */
  value: string | null;
  /** Called with the edited Markdown, or null when it was emptied. */
  onSave: (value: string | null) => void;
  /** Shows the text without letting it change. */
  disabled?: boolean;
  /** The save is in flight: the Save button shows a spinner. */
  saving?: boolean;
  /** @default 'Write… Markdown shortcuts work.' */
  placeholder?: string;
  /** The button shown when there's nothing yet. @default `Add ${label.toLowerCase()}…` */
  addLabel?: string;
  /** Shown read-only when there's nothing yet. @default `No ${label.toLowerCase()}.` */
  emptyLabel?: string;
  /** Renders the saved text when it isn't being edited, e.g. with citations as chips. @default `<Markdown>` */
  renderValue?: (value: string) => ReactNode;
  /** A warning under the editor about the draft, e.g. what saving it loses. */
  notice?: (draft: string) => ReactNode;
};

/**
 * A Markdown section shown as formatted text that turns into the rich-text editor on click, like a
 * ticket's description.
 * - Saves only on Save (or ⌘/Ctrl+Enter); Cancel or Esc drops the draft.
 * - Clicking a link or selecting text doesn't start editing.
 * - Long text scrolls inside the section, so what's below stays in reach.
 */
export default function EditableMarkdown(
  {
    label,
    value,
    onSave,
    disabled = false,
    saving = false,
    placeholder = 'Write… Markdown shortcuts work.',
    addLabel = `Add ${label.toLowerCase()}…`,
    emptyLabel = `No ${label.toLowerCase()}.`,
    renderValue,
    notice,
  }: EditableMarkdownProps,
) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const startEdit = () => {
    setDraft(value ?? '');
    setEditing(true);
  };
  const saveDraft = () => {
    onSave(draft.trim() || null);
    setEditing(false);
  };
  const cancel = () => {
    return setEditing(false);
  };

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        {!disabled && !editing && (
          <Button size="sm" variant="tertiary" onClick={startEdit}>
            <PencilSimple /> Edit
          </Button>
        )}
      </header>
      {editing
        ? (
          <>
            <RichTextEditor
              aria-label={label}
              className="max-h-[45dvh] shrink-0"
              value={draft}
              onChange={setDraft}
              onSubmit={saveDraft}
              onCancel={cancel}
              placeholder={placeholder}
              autoFocus
            />
            {notice?.(draft)}
            <div className="flex justify-end gap-2">
              <Button size="sm" onClick={cancel}>Cancel</Button>
              <Button size="sm" variant="primary" loading={saving} onClick={saveDraft}>Save</Button>
            </div>
          </>
        )
        : value
        ? (
          // a click on the text edits it, unless it's on a link or selecting
          <div
            className={cn(
              'max-h-[45dvh] shrink-0 overflow-y-auto rounded-md',
              !disabled && 'cursor-text hover:bg-fill-hover',
            )}
            onClick={(event) => {
              const selecting = Boolean(window.getSelection()?.toString());
              const onLink = event.target instanceof Element && event.target.closest('a, button');
              if (!disabled && !selecting && !onLink) {
                startEdit();
              }
            }}
          >
            {renderValue ? renderValue(value) : <Markdown>{value}</Markdown>}
          </div>
        )
        : disabled
        ? <p className="text-sm text-muted">{emptyLabel}</p>
        : (
          <button
            type="button"
            className="rounded-md px-2 py-3 text-left text-sm text-muted hover:bg-fill-hover hover:text-foreground"
            onClick={startEdit}
          >
            {addLabel}
          </button>
        )}
    </section>
  );
}
