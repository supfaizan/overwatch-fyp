'use client';

import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from '@tiptap/markdown';
import { type Editor, EditorContent, type JSONContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';
import { RICH_TEXT_CLASS } from '@/shared/components/rich-text-editor';
import { cn } from '@/shared/lib/cn';
import { Expand, Panel } from '../blocks';
import { isWebLink } from '../embeds';
import { DocImage } from '../image';
import { DateNode, Emoji, Status } from '../inline-nodes';
import { LayoutColumn, LayoutSection } from '../layout';
import { BlockCard, cardFor, EmbedCard, InlineCard } from '../link-cards';
import { SourceBlock, SourceInline, SourceMark } from '../source-nodes';
import { DocTable, DocTableCell, DocTableHeader } from '../table';
import { CELL_MIN_WIDTH, dragInnerColumnEdge, pinColumnWidths } from '../table-widths';

// pages are stored as editor JSON, so they keep what Markdown can't (underline, alignment);
// the Markdown copy, for search and AI answers, simply drops it
const extensions = (sourceName: string) => [
  StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
  // drag a column's edge to size it; the last column's edge sizes the whole table (see `pinColumnWidths`)
  TableKit.configure({ table: false, tableCell: false, tableHeader: false }),
  DocTable.configure({ resizable: true, cellMinWidth: CELL_MIN_WIDTH }),
  DocTableCell,
  DocTableHeader,
  TaskList,
  TaskItem.configure({ nested: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  DocImage,
  Emoji,
  Status,
  DateNode,
  LayoutSection,
  LayoutColumn,
  Panel,
  Expand,
  InlineCard,
  BlockCard,
  EmbedCard,
  SourceBlock.configure({ sourceName }),
  SourceInline.configure({ sourceName }),
  SourceMark,
  Markdown,
  Placeholder.configure({ placeholder: "Write, or use the toolbar above. Markdown works too: '# ' heading, '- ' list, '[] ' checklist…" }),
];

const TASK_LIST_CLASS = cn(
  '[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-1',
  '[&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2',
  '[&_li[data-type=taskItem]>label]:mt-1 [&_li[data-type=taskItem]>label>input]:size-4 [&_li[data-type=taskItem]>label>input]:accent-primary',
  '[&_li[data-type=taskItem]>div]:flex-1 [&_li[data-checked=true]>div]:text-muted [&_li[data-checked=true]>div]:line-through',
);

// a table may be wider than the text: it spreads out evenly on both sides up to the page's width
// (`100cqw`, the page is a size container), and scrolls beyond that; narrower ones line up with the text
const TABLE_CLASS = cn(
  '[&_.tableWrapper]:relative [&_.tableWrapper]:left-1/2 [&_.tableWrapper]:w-max [&_.tableWrapper]:min-w-full [&_.tableWrapper]:-translate-x-1/2',
  '[&_.tableWrapper]:max-w-[calc(100cqw-3rem)] [&_.tableWrapper]:overflow-x-auto [&_.tableWrapper]:pb-1',
  '[&_table]:table-fixed [&_td]:relative [&_th]:relative',
  '[&_.column-resize-handle]:pointer-events-none [&_.column-resize-handle]:absolute [&_.column-resize-handle]:-top-px [&_.column-resize-handle]:-right-0.5',
  '[&_.column-resize-handle]:-bottom-px [&_.column-resize-handle]:w-1 [&_.column-resize-handle]:bg-primary',
  '[&.resize-cursor]:cursor-col-resize [&_.selectedCell]:bg-primary/10',
);

// what a mirrored page has and this editor doesn't: shown, kept, not editable
const SOURCE_CLASS = cn(
  '[&_[data-source-block]]:my-2 [&_[data-source-block]]:rounded-md [&_[data-source-block]]:border [&_[data-source-block]]:border-dashed',
  '[&_[data-source-block]]:border-border [&_[data-source-block]]:bg-surface [&_[data-source-block]]:px-3 [&_[data-source-block]]:py-2',
  '[&_[data-source-block]]:text-xs [&_[data-source-block]]:text-muted',
  '[&_[data-source-inline]]:rounded [&_[data-source-inline]]:bg-surface [&_[data-source-inline]]:px-1 [&_[data-source-inline]]:text-muted',
  '[&_.ProseMirror-selectednode[data-source-block]]:outline-2 [&_.ProseMirror-selectednode[data-source-block]]:outline-primary',
);

// columns sit side by side from a tablet's width up, and stack on a phone
const LAYOUT_CLASS = cn(
  '[&_[data-layout-section]]:my-3 [&_[data-layout-section]]:flex [&_[data-layout-section]]:flex-col [&_[data-layout-section]]:gap-4',
  'sm:[&_[data-layout-section]]:flex-row',
  '[&_[data-layout-column]]:min-w-0 [&_[data-layout-column]]:rounded-md [&_[data-layout-column]]:border [&_[data-layout-column]]:border-dashed',
  '[&_[data-layout-column]]:border-transparent [&_[data-layout-column]]:px-1 [&_[data-layout-column]>*:first-child]:mt-0',
  '[&.ProseMirror[contenteditable=true]_[data-layout-column]]:border-border',
);

// emoji, status lozenges and dates inside a line
const INLINE_CLASS = cn(
  '[&_[data-emoji][data-custom]]:rounded [&_[data-emoji][data-custom]]:bg-surface [&_[data-emoji][data-custom]]:px-1 [&_[data-emoji][data-custom]]:text-muted',
  '[&_[data-status]]:rounded [&_[data-status]]:px-1.5 [&_[data-status]]:py-px [&_[data-status]]:text-[0.75em] [&_[data-status]]:font-semibold [&_[data-status]]:uppercase',
  '[&_[data-status=neutral]]:bg-fill-active [&_[data-status=blue]]:bg-accent-blue/15 [&_[data-status=blue]]:text-accent-blue',
  '[&_[data-status=green]]:bg-success/15 [&_[data-status=green]]:text-success [&_[data-status=red]]:bg-danger/15 [&_[data-status=red]]:text-danger',
  '[&_[data-status=yellow]]:bg-warning/20 [&_[data-status=yellow]]:text-warning-strong [&_[data-status=purple]]:bg-accent-purple/15 [&_[data-status=purple]]:text-accent-purple',
  '[&_time[data-timestamp]]:rounded [&_time[data-timestamp]]:bg-fill-active [&_time[data-timestamp]]:px-1.5',
  '[&_.ProseMirror-selectednode:is([data-emoji],[data-status],time)]:outline-2 [&_.ProseMirror-selectednode:is([data-emoji],[data-status],time)]:outline-primary',
);

const IMAGE_CLASS = cn(
  '[&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-border',
  '[&_img.ProseMirror-selectednode]:outline-2 [&_img.ProseMirror-selectednode]:outline-offset-2 [&_img.ProseMirror-selectednode]:outline-primary',
  '[&_img[data-uploading]]:animate-pulse [&_img[data-uploading]]:opacity-60',
);

const imageFiles = (list: FileList | undefined | null) => Array.from(list ?? []).filter((file) => file.type.startsWith('image/'));

type DocEditorProps = {
  /** Read once: the editor owns the content after that. */
  initial: JSONContent;
  editable: boolean;
  /** Hands over the editor, for the toolbar and so a save reads the newest content itself. */
  onEditor: (editor: Editor | null) => void;
  /** Every edit; cheap, so the content is only serialised when it's saved. */
  onChange: () => void;
  /** Image files pasted or dropped in; `at` is where they were dropped. */
  onImages: (files: File[], at?: number) => void;
  /** For a mirrored page: where what the editor can't change is edited instead. */
  sourceName?: string;
};

/** A page's body: full width and borderless; the toolbar above drives it. */
export default function DocEditor({ initial, editable, onEditor, onChange, onImages, sourceName = 'its source' }: DocEditorProps) {
  const handlers = useRef({ onEditor, onChange, onImages });
  useEffect(() => {
    handlers.current = { onEditor, onChange, onImages };
  });
  const editor = useEditor({
    extensions: extensions(sourceName),
    content: initial,
    editable,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: { class: cn('min-h-[60vh] pb-24 text-[15px]', RICH_TEXT_CLASS, TASK_LIST_CLASS, TABLE_CLASS, LAYOUT_CLASS, INLINE_CLASS, IMAGE_CLASS, SOURCE_CLASS), 'aria-label': 'Page content', 'aria-multiline': 'true', role: 'textbox' },
      // pasted or dropped image files upload; a link pasted on an empty line becomes a card (or an
      // embed, where its site allows); anything else pastes and drops as usual
      handlePaste: (view, event) => {
        const files = imageFiles(event.clipboardData?.files);
        if (files.length) {
          handlers.current.onImages(files);
          return true;
        }
        const text = event.clipboardData?.getData('text/plain') ?? '';
        const { empty, $from } = view.state.selection;
        if (!isWebLink(text) || !empty || $from.parent.type.name !== 'paragraph' || $from.parent.content.size) return false;
        view.dispatch(view.state.tr.replaceSelectionWith(cardFor(view.state.schema, text.trim())).scrollIntoView());
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = moved ? [] : imageFiles(event.dataTransfer?.files);
        if (!files.length) return false;
        handlers.current.onImages(files, view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos);
        return true;
      },
      handleDOMEvents: {
        // runs before the resize plugin's own mousedown: a drag on a column edge works with real widths,
        // an inner edge is dragged here (the table keeps its width), the last edge by the plugin
        mousedown: (view, event) => {
          const table = view.dom.classList.contains('resize-cursor') && event.target instanceof Element ? event.target.closest('table') : null;
          if (!table) return false;
          pinColumnWidths(view, table);
          return dragInnerColumnEdge(view, event);
        },
      },
    },
    onUpdate: () => handlers.current.onChange(),
  });

  useEffect(() => {
    handlers.current.onEditor(editor);
    return () => handlers.current.onEditor(null);
  }, [editor]);

  return <EditorContent editor={editor} />;
}
