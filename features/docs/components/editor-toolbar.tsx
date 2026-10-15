'use client';

import type { Icon } from '@phosphor-icons/react';
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  CaretDown,
  Code,
  CodeBlock,
  Image as ImageIcon,
  LinkSimple,
  ListBullets,
  ListChecks,
  ListNumbers,
  Minus,
  Quotes,
  Table,
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
  TextB,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
} from '@phosphor-icons/react/ssr';
import { type Editor, useEditorState } from '@tiptap/react';
import { useRef, useState } from 'react';
import Button from '@/shared/components/button';
import { Dialog, DialogContent } from '@/shared/components/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/dropdown-menu';
import { Input } from '@/shared/components/input';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { IMAGE_TYPES } from '../lib';
import { pinColumnWidths, tableAtSelection } from '../table-widths';

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl+';

const STYLES = [
  { label: 'Normal text', level: 0 },
  { label: 'Heading 1', level: 1 },
  { label: 'Heading 2', level: 2 },
  { label: 'Heading 3', level: 3 },
] as const;

const ALIGNS = [
  { value: 'left', label: 'Align left', icon: TextAlignLeft },
  { value: 'center', label: 'Align center', icon: TextAlignCenter },
  { value: 'right', label: 'Align right', icon: TextAlignRight },
  { value: 'justify', label: 'Justify', icon: TextAlignJustify },
] as const;

/**
 * Everything the editor can do, named and in view (Confluence's toolbar): text style, marks, lists,
 * alignment, blocks, links, tables, undo. It re-renders only when what the selection allows changes.
 */
export default function EditorToolbar({ editor, onImages }: { editor: Editor; onImages: (files: File[]) => void }) {
  const [linking, setLinking] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      level: ([1, 2, 3] as const).find((level) => current.isActive('heading', { level })) ?? 0,
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      underline: current.isActive('underline'),
      strike: current.isActive('strike'),
      code: current.isActive('code'),
      bulletList: current.isActive('bulletList'),
      orderedList: current.isActive('orderedList'),
      taskList: current.isActive('taskList'),
      align: ALIGNS.find(({ value }) => current.isActive({ textAlign: value }))?.value ?? 'left',
      blockquote: current.isActive('blockquote'),
      codeBlock: current.isActive('codeBlock'),
      link: current.isActive('link'),
      table: current.isActive('table'),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });
  const run = (command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => command(editor.chain().focus()).run();
  const insertTable = () => {
    run((chain) => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
    // once it's drawn, its columns get real widths, so its edges size it straight away
    requestAnimationFrame(() => {
      const table = tableAtSelection(editor.view);
      if (table) pinColumnWidths(editor.view, table);
    });
  };
  const style = STYLES.find(({ level }) => level === state.level) ?? STYLES[0];
  const align = ALIGNS.find(({ value }) => value === state.align) ?? ALIGNS[0];

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5">
      <DropdownMenu modal={false}>
        <Tooltip content="Text style">
          <DropdownMenuTrigger asChild>
            <Button variant="tertiary" size="sm" className="w-32 justify-between font-normal">
              {style.label}
              <CaretDown aria-hidden className="size-3 text-muted" />
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="start">
          {STYLES.map(({ label, level }) => (
            <DropdownMenuItem key={level} onSelect={() => run((chain) => (level ? chain.setHeading({ level }) : chain.setParagraph()))} className={cn(level === 1 && 'text-lg font-semibold', level === 2 && 'text-base font-semibold', level === 3 && 'font-semibold', level === state.level && 'bg-fill-active')}>
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Divider />
      <Tool icon={TextB} label="Bold" shortcut={`${MOD}B`} active={state.bold} onClick={() => run((chain) => chain.toggleBold())} />
      <Tool icon={TextItalic} label="Italic" shortcut={`${MOD}I`} active={state.italic} onClick={() => run((chain) => chain.toggleItalic())} />
      <Tool icon={TextUnderline} label="Underline" shortcut={`${MOD}U`} active={state.underline} onClick={() => run((chain) => chain.toggleUnderline())} />
      <Tool icon={TextStrikethrough} label="Strikethrough" shortcut={`${MOD}⇧S`} active={state.strike} onClick={() => run((chain) => chain.toggleStrike())} />
      <Tool icon={Code} label="Inline code" shortcut={`${MOD}E`} active={state.code} onClick={() => run((chain) => chain.toggleCode())} />
      <Divider />
      <Tool icon={ListBullets} label="Bullet list" shortcut={`${MOD}⇧8`} active={state.bulletList} onClick={() => run((chain) => chain.toggleBulletList())} />
      <Tool icon={ListNumbers} label="Numbered list" shortcut={`${MOD}⇧7`} active={state.orderedList} onClick={() => run((chain) => chain.toggleOrderedList())} />
      <Tool icon={ListChecks} label="Checklist" shortcut={`${MOD}⇧9`} active={state.taskList} onClick={() => run((chain) => chain.toggleTaskList())} />
      <DropdownMenu modal={false}>
        <Tooltip content="Alignment">
          <DropdownMenuTrigger asChild>
            <Button variant="tertiary" size="sm" aria-label="Alignment" className="gap-0.5 px-1.5">
              <align.icon aria-hidden className="size-4" />
              <CaretDown aria-hidden className="size-3 text-muted" />
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="start">
          {ALIGNS.map(({ value, label, icon: AlignIcon }) => (
            <DropdownMenuItem key={value} onSelect={() => run((chain) => chain.setTextAlign(value))} className={cn(value === state.align && 'bg-fill-active')}>
              <AlignIcon aria-hidden />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Divider />
      <Tool icon={Quotes} label="Quote" shortcut={`${MOD}⇧B`} active={state.blockquote} onClick={() => run((chain) => chain.toggleBlockquote())} />
      <Tool icon={CodeBlock} label="Code block" shortcut={`${MOD}⌥C`} active={state.codeBlock} onClick={() => run((chain) => chain.toggleCodeBlock())} />
      <Tool icon={Minus} label="Divider" shortcut="---" onClick={() => run((chain) => chain.setHorizontalRule())} />
      <Tool icon={ImageIcon} label="Image (or paste / drop one in)" onClick={() => picker.current?.click()} />
      <input
        ref={picker}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        multiple
        hidden
        onChange={(event) => {
          onImages(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
      <Tool icon={LinkSimple} label={state.link ? 'Edit link' : 'Link'} active={state.link} onClick={() => setLinking(true)} />
      {state.table ? (
        <TableMenu run={run} />
      ) : (
        <Tool icon={Table} label="Table" onClick={insertTable} />
      )}
      <Divider />
      <Tool icon={ArrowUUpLeft} label="Undo" shortcut={`${MOD}Z`} disabled={!state.canUndo} onClick={() => run((chain) => chain.undo())} />
      <Tool icon={ArrowUUpRight} label="Redo" shortcut={`${MOD}⇧Z`} disabled={!state.canRedo} onClick={() => run((chain) => chain.redo())} />
      {linking && <LinkDialog editor={editor} onClose={() => setLinking(false)} />}
    </div>
  );
}

type ToolProps = { icon: Icon; label: string; shortcut?: string; active?: boolean; disabled?: boolean; onClick: () => void };

function Tool({ icon: ToolIcon, label, shortcut, active = false, disabled = false, onClick }: ToolProps) {
  return (
    <Tooltip content={shortcut ? `${label}  ${shortcut}` : label}>
      <Button
        variant="tertiary"
        size="sm"
        iconOnly
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        // keep the selection in the editor
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
        className={cn(active && 'bg-primary/10 text-primary hover:bg-primary/15')}
      >
        <ToolIcon aria-hidden weight={active ? 'bold' : 'regular'} className="size-4" />
      </Button>
    </Tooltip>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px bg-border" />;

type Run = (command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => boolean;

function TableMenu({ run }: { run: Run }) {
  const items: { label: string; command: Parameters<Run>[0]; danger?: boolean }[] = [
    { label: 'Add row above', command: (chain) => chain.addRowBefore() },
    { label: 'Add row below', command: (chain) => chain.addRowAfter() },
    { label: 'Add column left', command: (chain) => chain.addColumnBefore() },
    { label: 'Add column right', command: (chain) => chain.addColumnAfter() },
    { label: 'Header row on/off', command: (chain) => chain.toggleHeaderRow() },
    { label: 'Delete row', command: (chain) => chain.deleteRow(), danger: true },
    { label: 'Delete column', command: (chain) => chain.deleteColumn(), danger: true },
    { label: 'Delete table', command: (chain) => chain.deleteTable(), danger: true },
  ];
  return (
    <DropdownMenu modal={false}>
      <Tooltip content="Table">
        <DropdownMenuTrigger asChild>
          <Button variant="tertiary" size="sm" aria-label="Table" className="gap-0.5 bg-primary/10 px-1.5 text-primary">
            <Table aria-hidden className="size-4" />
            <CaretDown aria-hidden className="size-3" />
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="start">
        {items.map(({ label, command, danger }, index) => (
          <div key={label}>
            {danger && !items[index - 1]?.danger && <DropdownMenuSeparator />}
            <DropdownMenuItem danger={danger} onSelect={() => run(command)}>{label}</DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Adds, changes or removes the link on the selection; only web and mail addresses. */
function LinkDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [href, setHref] = useState<string>(editor.getAttributes('link').href ?? '');
  const [error, setError] = useState('');
  const save = () => {
    const value = href.trim();
    const chain = editor.chain().focus().extendMarkRange('link');
    if (!value) {
      chain.unsetLink().run();
      return onClose();
    }
    const url = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
    if (!/^(https?:|mailto:)/i.test(url)) return setError('Use a web (https://) or email (mailto:) address.');
    chain.setLink({ href: url }).run();
    onClose();
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        title="Link"
        description="Paste an address. Leave it empty to remove the link."
        footer={
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save}>Save link</Button>
          </>
        }
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="flex flex-col gap-1.5"
        >
          {/* eslint-disable-next-line jsx-a11y/no-autofocus -- the dialog exists to type this */}
          <Input autoFocus value={href} onChange={(event) => setHref(event.target.value)} placeholder="https://example.com" aria-label="Address" aria-invalid={Boolean(error)} />
          {error && <p className="text-xs text-danger">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
