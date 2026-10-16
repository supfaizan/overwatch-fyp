'use client';

import Button from '@/shared/components/button';
import { Dialog, DialogContent } from '@/shared/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/dropdown-menu';
import { Input } from '@/shared/components/input';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import type { Icon } from '@phosphor-icons/react';
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  CaretDown,
  Code,
  CodeBlock,
  Columns,
  FrameCorners,
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
import { EMBED_PROVIDERS, isWebLink } from '../embeds';
import { insertColumns, LayoutSection, MAX_COLUMNS, removeColumns } from '../layout';
import { IMAGE_TYPES } from '../lib';
import { cardFor } from '../link-cards';
import { pinColumnWidths, tableAtSelection } from '../table-widths';

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
  ? '⌘'
  : 'Ctrl+';

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
/** `onImages` is left out where images can't be added (pages mirrored from a source). */
export default function EditorToolbar(
  { editor, onImages }: { editor: Editor; onImages?: (files: File[]) => void },
) {
  const [linking, setLinking] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      return {
        level: ([1, 2, 3] as const).find((level) => {
          return current.isActive('heading', { level });
        }) ?? 0,
        bold: current.isActive('bold'),
        italic: current.isActive('italic'),
        underline: current.isActive('underline'),
        strike: current.isActive('strike'),
        code: current.isActive('code'),
        bulletList: current.isActive('bulletList'),
        orderedList: current.isActive('orderedList'),
        taskList: current.isActive('taskList'),
        align: ALIGNS.find(({ value }) => {
          return current.isActive({ textAlign: value });
        })?.value ?? 'left',
        blockquote: current.isActive('blockquote'),
        codeBlock: current.isActive('codeBlock'),
        link: current.isActive('link'),
        table: current.isActive('table'),
        columns: current.isActive(LayoutSection.name),
        canUndo: current.can().undo(),
        canRedo: current.can().redo(),
      };
    },
  });
  const run = (command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => {
    return command(editor.chain().focus()).run();
  };
  const insertTable = () => {
    run((chain) => {
      return chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
    });
    // once it's drawn, its columns get real widths, so its edges size it straight away
    requestAnimationFrame(() => {
      const table = tableAtSelection(editor.view);
      if (table) {
        pinColumnWidths(editor.view, table);
      }
    });
  };
  const style = STYLES.find(({ level }) => {
    return level === state.level;
  }) ?? STYLES[0];
  const align = ALIGNS.find(({ value }) => {
    return value === state.align;
  }) ?? ALIGNS[0];

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
          {STYLES.map(({ label, level }) => {
            return (
              <DropdownMenuItem
                key={level}
                onSelect={() => {
                  return run((chain) => {
                    return (level ? chain.setHeading({ level }) : chain.setParagraph());
                  });
                }}
                className={cn(
                  level === 1 && 'text-lg font-semibold',
                  level === 2 && 'text-base font-semibold',
                  level === 3 && 'font-semibold',
                  level === state.level && 'bg-fill-active',
                )}
              >
                {label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <Divider />
      <Tool
        icon={TextB}
        label="Bold"
        shortcut={`${MOD}B`}
        active={state.bold}
        onClick={() => {
          return run((chain) => {
            return chain.toggleBold();
          });
        }}
      />
      <Tool
        icon={TextItalic}
        label="Italic"
        shortcut={`${MOD}I`}
        active={state.italic}
        onClick={() => {
          return run((chain) => {
            return chain.toggleItalic();
          });
        }}
      />
      <Tool
        icon={TextUnderline}
        label="Underline"
        shortcut={`${MOD}U`}
        active={state.underline}
        onClick={() => {
          return run((chain) => {
            return chain.toggleUnderline();
          });
        }}
      />
      <Tool
        icon={TextStrikethrough}
        label="Strikethrough"
        shortcut={`${MOD}⇧S`}
        active={state.strike}
        onClick={() => {
          return run((chain) => {
            return chain.toggleStrike();
          });
        }}
      />
      <Tool
        icon={Code}
        label="Inline code"
        shortcut={`${MOD}E`}
        active={state.code}
        onClick={() => {
          return run((chain) => {
            return chain.toggleCode();
          });
        }}
      />
      <Divider />
      <Tool
        icon={ListBullets}
        label="Bullet list"
        shortcut={`${MOD}⇧8`}
        active={state.bulletList}
        onClick={() => {
          return run((chain) => {
            return chain.toggleBulletList();
          });
        }}
      />
      <Tool
        icon={ListNumbers}
        label="Numbered list"
        shortcut={`${MOD}⇧7`}
        active={state.orderedList}
        onClick={() => {
          return run((chain) => {
            return chain.toggleOrderedList();
          });
        }}
      />
      <Tool
        icon={ListChecks}
        label="Checklist"
        shortcut={`${MOD}⇧9`}
        active={state.taskList}
        onClick={() => {
          return run((chain) => {
            return chain.toggleTaskList();
          });
        }}
      />
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
          {ALIGNS.map(({ value, label, icon: AlignIcon }) => {
            return (
              <DropdownMenuItem
                key={value}
                onSelect={() => {
                  return run((chain) => {
                    return chain.setTextAlign(value);
                  });
                }}
                className={cn(value === state.align && 'bg-fill-active')}
              >
                <AlignIcon aria-hidden />
                {label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <Divider />
      <Tool
        icon={Quotes}
        label="Quote"
        shortcut={`${MOD}⇧B`}
        active={state.blockquote}
        onClick={() => {
          return run((chain) => {
            return chain.toggleBlockquote();
          });
        }}
      />
      <Tool
        icon={CodeBlock}
        label="Code block"
        shortcut={`${MOD}⌥C`}
        active={state.codeBlock}
        onClick={() => {
          return run((chain) => {
            return chain.toggleCodeBlock();
          });
        }}
      />
      <Tool
        icon={Minus}
        label="Divider"
        shortcut="---"
        onClick={() => {
          return run((chain) => {
            return chain.setHorizontalRule();
          });
        }}
      />
      {onImages && (
        <>
          <Tool
            icon={ImageIcon}
            label="Image (or paste / drop one in)"
            onClick={() => {
              return picker.current?.click();
            }}
          />
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
        </>
      )}
      <Tool
        icon={LinkSimple}
        label={state.link ? 'Edit link' : 'Link'}
        active={state.link}
        onClick={() => {
          return setLinking(true);
        }}
      />
      <Tool
        icon={FrameCorners}
        label="Embed or link card"
        onClick={() => {
          return setEmbedding(true);
        }}
      />
      {state.table
        ? <TableMenu run={run} />
        : <Tool icon={Table} label="Table" onClick={insertTable} />}
      <ColumnsMenu editor={editor} active={state.columns} />
      <Divider />
      <Tool
        icon={ArrowUUpLeft}
        label="Undo"
        shortcut={`${MOD}Z`}
        disabled={!state.canUndo}
        onClick={() => {
          return run((chain) => {
            return chain.undo();
          });
        }}
      />
      <Tool
        icon={ArrowUUpRight}
        label="Redo"
        shortcut={`${MOD}⇧Z`}
        disabled={!state.canRedo}
        onClick={() => {
          return run((chain) => {
            return chain.redo();
          });
        }}
      />
      {linking && (
        <LinkDialog
          editor={editor}
          onClose={() => {
            return setLinking(false);
          }}
        />
      )}
      {embedding && (
        <EmbedDialog
          editor={editor}
          onClose={() => {
            return setEmbedding(false);
          }}
        />
      )}
    </div>
  );
}

type ToolProps = {
  icon: Icon;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function Tool(
  { icon: ToolIcon, label, shortcut, active = false, disabled = false, onClick }: ToolProps,
) {
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
        onMouseDown={(event) => {
          return event.preventDefault();
        }}
        onClick={onClick}
        className={cn(active && 'bg-primary/10 text-primary hover:bg-primary/15')}
      >
        <ToolIcon aria-hidden weight={active ? 'bold' : 'regular'} className="size-4" />
      </Button>
    </Tooltip>
  );
}

const Divider = () => {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border" />;
};

type Run = (
  command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>,
) => boolean;

function TableMenu({ run }: { run: Run }) {
  const items: { label: string; command: Parameters<Run>[0]; danger?: boolean }[] = [
    {
      label: 'Add row above',
      command: (chain) => {
        return chain.addRowBefore();
      },
    },
    {
      label: 'Add row below',
      command: (chain) => {
        return chain.addRowAfter();
      },
    },
    {
      label: 'Add column left',
      command: (chain) => {
        return chain.addColumnBefore();
      },
    },
    {
      label: 'Add column right',
      command: (chain) => {
        return chain.addColumnAfter();
      },
    },
    {
      label: 'Header row on/off',
      command: (chain) => {
        return chain.toggleHeaderRow();
      },
    },
    {
      label: 'Delete row',
      command: (chain) => {
        return chain.deleteRow();
      },
      danger: true,
    },
    {
      label: 'Delete column',
      command: (chain) => {
        return chain.deleteColumn();
      },
      danger: true,
    },
    {
      label: 'Delete table',
      command: (chain) => {
        return chain.deleteTable();
      },
      danger: true,
    },
  ];
  return (
    <DropdownMenu modal={false}>
      <Tooltip content="Table">
        <DropdownMenuTrigger asChild>
          <Button
            variant="tertiary"
            size="sm"
            aria-label="Table"
            className="gap-0.5 bg-primary/10 px-1.5 text-primary"
          >
            <Table aria-hidden className="size-4" />
            <CaretDown aria-hidden className="size-3" />
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="start">
        {items.map(({ label, command, danger }, index) => {
          return (
            <div key={label}>
              {danger && !items[index - 1]?.danger && <DropdownMenuSeparator />}
              <DropdownMenuItem
                danger={danger}
                onSelect={() => {
                  return run(command);
                }}
              >
                {label}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const COLUMN_COUNTS = Array.from({ length: MAX_COLUMNS - 1 }, (_, index) => {
  return index + 2;
});

/** Lays content out in columns, or back out of them; columns don't nest. */
function ColumnsMenu({ editor, active }: { editor: Editor; active: boolean }) {
  return (
    <DropdownMenu modal={false}>
      <Tooltip content="Columns">
        <DropdownMenuTrigger asChild>
          <Button
            variant="tertiary"
            size="sm"
            aria-label="Columns"
            className={cn('gap-0.5 px-1.5', active && 'bg-primary/10 text-primary')}
          >
            <Columns aria-hidden className="size-4" />
            <CaretDown aria-hidden className="size-3" />
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="start">
        {active
          ? (
            <DropdownMenuItem
              onSelect={() => {
                return removeColumns(editor);
              }}
            >
              Remove columns
            </DropdownMenuItem>
          )
          : (
            COLUMN_COUNTS.map((count) => {
              return (
                <DropdownMenuItem
                  key={count}
                  onSelect={() => {
                    return insertColumns(editor, count);
                  }}
                >
                  {count} columns
                </DropdownMenuItem>
              );
            })
          )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Puts a link on its own line: playing in the page where its site allows, as a card otherwise. */
function EmbedDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [href, setHref] = useState('');
  const [error, setError] = useState('');
  const save = () => {
    const value = href.trim();
    const url = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
    if (!value || !isWebLink(url)) {
      return setError('Use a web (https://) address.');
    }
    editor.chain().focus().insertContent(cardFor(editor.schema, url).toJSON()).run();
    onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        return !open && onClose();
      }}
    >
      <DialogContent
        title="Embed or link card"
        description={`Links from ${
          EMBED_PROVIDERS.join(', ')
        } play in the page; others show as a card. Select one to show it another way.`}
        footer={
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save}>Insert</Button>
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
          <Input
            autoFocus
            value={href}
            onChange={(event) => {
              return setHref(event.target.value);
            }}
            placeholder="https://www.loom.com/share/…"
            aria-label="Address"
            aria-invalid={Boolean(error)}
          />
          {error && <p className="text-xs text-danger">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
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
    if (!/^(https?:|mailto:)/i.test(url)) {
      return setError('Use a web (https://) or email (mailto:) address.');
    }
    chain.setLink({ href: url }).run();
    onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        return !open && onClose();
      }}
    >
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
          <Input
            autoFocus
            value={href}
            onChange={(event) => {
              return setHref(event.target.value);
            }}
            placeholder="https://example.com"
            aria-label="Address"
            aria-invalid={Boolean(error)}
          />
          {error && <p className="text-xs text-danger">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
