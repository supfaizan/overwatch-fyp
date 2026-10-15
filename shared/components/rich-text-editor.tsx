'use client';

import { cn } from '@/shared/lib/cn';
import { TableKit } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from '@tiptap/markdown';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';
import { field } from './input';

// ProseMirror renders plain elements, so the typography is set on them from the editor's root
/** The editor's typography, for another editor of the same content (e.g. the docs page editor). */
export const RICH_TEXT_CLASS = cn(
  'text-sm leading-relaxed break-words outline-none',
  '[&>*+*]:mt-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold',
  '[&_h4]:font-semibold [&_h5]:font-semibold [&_h6]:font-semibold',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li>p]:my-0.5',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-muted',
  '[&_hr]:border-border [&_a]:text-primary [&_a]:underline-offset-2 [&_a:hover]:underline',
  // `INLINE_CODE_CLASS`, spelled out so Tailwind sees it
  '[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-primary/10 [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono',
  '[&_:not(pre)>code]:text-[0.85em] [&_:not(pre)>code]:text-primary-strong dark:[&_:not(pre)>code]:text-primary',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-fill-hover [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs',
  '[&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1',
  '[&_th]:border [&_th]:border-border [&_th]:bg-fill-hover [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold',
  // the placeholder, drawn on the first empty paragraph
  '[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left',
  '[&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted',
  '[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
);

const richTextExtensions = (placeholder?: string) => {
  return [
    StarterKit.configure({ underline: false, link: { openOnClick: false, autolink: true } }),
    TableKit,
    Markdown,
    Placeholder.configure({ placeholder }),
  ];
};

type RichTextEditorProps = {
  /** The starting Markdown. Read once: the editor owns the text after that. */
  value: string;
  /** Called with the text as Markdown after every change. */
  onChange: (markdown: string) => void;
  /** Required: the editor's accessible name. */
  'aria-label': string;
  /** Shown while it's empty. */
  placeholder?: string;
  /** @default false */
  autoFocus?: boolean;
  /** Mod+Enter, e.g. to save. */
  onSubmit?: () => void;
  /** Esc, e.g. to cancel. Inside a dialog, also stop the dialog closing on that Esc (`onEscapeKeyDown`). */
  onCancel?: () => void;
  /** Goes on the field, e.g. a max height; the text scrolls inside it. */
  className?: string;
};

/**
 * Edits rich text the way Jira, Linear and ClickUp do: Markdown typed as you go becomes formatting at
 * once (`**bold**`, `` `code` ``, `# ` heading, `- ` list, `> ` quote, ```` ``` ```` code block), and the
 * result comes back as Markdown. Tiptap (ProseMirror) underneath; client-only.
 * - Pair it with `Markdown` for the read-only view; both read and write the same Markdown.
 * - Heavy: load it with `next/dynamic` where it's only shown on demand (e.g. after clicking Edit).
 * - Keyboard: Mod+B / Mod+I / Mod+E for bold, italic and code; `onSubmit` on Mod+Enter, `onCancel` on Esc.
 * - No underline, colors or panels: the text must stay expressible as Markdown.
 */
export default function RichTextEditor(
  { value, onChange, placeholder, autoFocus = false, onSubmit, onCancel, className, ...props }:
    RichTextEditorProps,
) {
  // the editor is set up once, so it calls the latest handlers through here
  const handlers = useRef({ onChange, onSubmit, onCancel });
  useEffect(() => {
    handlers.current = { onChange, onSubmit, onCancel };
  });
  const editor = useEditor({
    extensions: richTextExtensions(placeholder),
    content: value,
    contentType: 'markdown',
    autofocus: autoFocus ? 'end' : false,
    // rendered on the client only, and only this editor's own DOM changes as the user types
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: cn('min-h-32 px-3 py-2', RICH_TEXT_CLASS),
        'aria-label': props['aria-label'],
        'aria-multiline': 'true',
        role: 'textbox',
      },
      handleKeyDown: (_view, event) => {
        const { onSubmit: submit, onCancel: cancel } = handlers.current;
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && submit) {
          submit();
          return true;
        }
        if (event.key === 'Escape' && cancel) {
          cancel();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: current }) => {
      return handlers.current.onChange(current.getMarkdown());
    },
  });

  return <EditorContent editor={editor} className={cn(field, 'overflow-y-auto', className)} />;
}
