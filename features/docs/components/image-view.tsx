'use client';

import Button from '@/shared/components/button';
import {
  CONTEXT_MENU_PARTS,
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/shared/components/context-menu';
import { Dialog, DialogContent } from '@/shared/components/dialog';
import {
  DROPDOWN_MENU_PARTS,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  type MenuParts,
} from '@/shared/components/dropdown-menu';
import { Input } from '@/shared/components/input';
import { cn } from '@/shared/lib/cn';
import {
  ArrowsHorizontal,
  ArrowsInLineHorizontal,
  ArrowsOutLineHorizontal,
  ArrowSquareOut,
  Check,
  DotsThree,
  FrameCorners,
  Textbox,
  Trash,
} from '@phosphor-icons/react';
import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type SyntheticEvent,
  useRef,
  useState,
} from 'react';
import { ALT_MAX_LENGTH, clampImageWidth, IMAGE_SIZE, IMAGE_WIDTH, imageAlt } from '../lib';

/** Marks the parts of an image that work on their own, so the editor leaves their events alone. */
export const IMAGE_CONTROL = 'data-image-control';

const SIZES: { label: string; width: number | null; icon: ReactNode }[] = [
  {
    label: `Small (${IMAGE_SIZE.small}%)`,
    width: IMAGE_SIZE.small,
    icon: <ArrowsInLineHorizontal />,
  },
  { label: `Medium (${IMAGE_SIZE.medium}%)`, width: IMAGE_SIZE.medium, icon: <ArrowsHorizontal /> },
  { label: 'Full width', width: IMAGE_SIZE.full, icon: <ArrowsOutLineHorizontal /> },
  { label: 'Original size', width: IMAGE_SIZE.original, icon: <FrameCorners /> },
];

const HANDLE_CLASS =
  'absolute z-10 border-2 border-surface bg-primary opacity-0 transition-opacity group-hover/image:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary';

type Drag = { startX: number; startPx: number; columnPx: number };

// the menus hand focus back to the image themselves; the alt text dialog takes it instead
const keepFocus = (event: Event) => {
  event.preventDefault();
};

/**
 * An image in a page. While editing: drag a handle (or use the arrow keys on it) to resize, and
 * right-click or use the "…" button for sizes, alt text and delete. Read-only pages keep the browser's menu.
 */
export default function ImageView(
  { node, editor, selected, getPos, updateAttributes, deleteNode }: NodeViewProps,
) {
  const src = typeof node.attrs.src === 'string' ? node.attrs.src : '';
  const alt = typeof node.attrs.alt === 'string' ? node.attrs.alt : null;
  const width = typeof node.attrs.width === 'number' ? node.attrs.width : null;
  const uploading = Boolean(node.attrs.uploadId);
  const editable = editor.isEditable;
  const [draft, setDraft] = useState<number | null>(null);
  const [editingAlt, setEditingAlt] = useState(false);
  const column = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const shown = draft ?? width;

  const resize = (next: number | null) => {
    if (next !== width) {
      updateAttributes({ width: next });
    }
  };
  // the width it's showing at, for keyboard steps from an image still at its own size
  const currentWidth = () => {
    if (width !== null || !frame.current || !column.current) {
      return width ?? IMAGE_WIDTH.max;
    }
    return clampImageWidth((frame.current.offsetWidth / column.current.clientWidth) * 100);
  };
  const select = () => {
    const pos = getPos();
    if (typeof pos === 'number') {
      editor.commands.setNodeSelection(pos);
    }
  };

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    if (!frame.current || !column.current) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startX: event.clientX,
      startPx: frame.current.offsetWidth,
      columnPx: column.current.clientWidth,
    };
  };
  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (current) {
      setDraft(
        clampImageWidth(
          ((current.startPx + event.clientX - current.startX) / current.columnPx) * 100,
        ),
      );
    }
  };
  // one change per drag, so it's one undo step and one save
  const endDrag = (commit: boolean) => {
    drag.current = null;
    if (commit && draft !== null) {
      resize(draft);
    }
    setDraft(null);
  };
  const nudge = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && drag.current) {
      return endDrag(false);
    }
    const step = event.shiftKey ? IMAGE_WIDTH.bigStep : IMAGE_WIDTH.step;
    const next = {
      ArrowLeft: currentWidth() - step,
      ArrowRight: currentWidth() + step,
      Home: IMAGE_WIDTH.min,
      End: IMAGE_WIDTH.max,
    }[event.key];
    if (next !== undefined) {
      event.preventDefault();
      resize(clampImageWidth(next));
    }
  };
  const dragProps = {
    [IMAGE_CONTROL]: '',
    onPointerDown: startDrag,
    onPointerMove: moveDrag,
    onPointerUp: () => {
      return endDrag(true);
    },
    onPointerCancel: () => {
      return endDrag(false);
    },
  };
  // one keyboard stop for resizing: the edge handle; the corner is a second grip for the mouse
  const sliderProps = {
    role: 'slider',
    tabIndex: 0,
    'aria-label': 'Image width',
    'aria-valuemin': IMAGE_WIDTH.min,
    'aria-valuemax': IMAGE_WIDTH.max,
    'aria-valuenow': shown ?? currentWidth(),
    'aria-valuetext': shown === null ? 'Original size' : `${shown}% wide`,
    onKeyDown: nudge,
  };

  const actions = ({ Item, Label, Separator }: MenuParts) => {
    return (
      <>
        <Label>Size</Label>
        {SIZES.map((size) => {
          return (
            <Item
              key={size.label}
              onSelect={() => {
                return resize(size.width);
              }}
            >
              {size.icon}
              {size.label}
              {size.width === width && <Check className="ml-auto" />}
            </Item>
          );
        })}
        <Separator />
        <Item
          onSelect={() => {
            return setEditingAlt(true);
          }}
        >
          <Textbox /> Edit alt text…
        </Item>
        {src && !uploading && (
          <Item
            onSelect={() => {
              return window.open(src, '_blank', 'noopener,noreferrer');
            }}
          >
            <ArrowSquareOut /> Open original
          </Item>
        )}
        <Separator />
        <Item
          danger
          onSelect={() => {
            deleteNode();
            editor.commands.focus();
          }}
        >
          <Trash /> Delete image
        </Item>
      </>
    );
  };

  const image = (
    <div
      ref={frame}
      className={cn(
        'group/image relative max-w-full',
        shown === null && 'w-fit',
        editable && selected && 'rounded-md outline-2 outline-offset-2 outline-primary',
      )}
      style={shown === null ? undefined : { width: `${shown}%` }}
      onClick={editable ? select : undefined}
      onContextMenu={editable ? select : undefined}
    >
      <img
        src={src}
        alt={alt ?? ''}
        loading="lazy"
        draggable
        data-drag-handle=""
        className={cn(
          'block h-auto max-w-full rounded-md border border-border',
          shown !== null && 'w-full',
          uploading && 'animate-pulse opacity-60',
        )}
      />
      {editable && (
        <>
          <span
            {...dragProps}
            {...sliderProps}
            className={cn(
              HANDLE_CLASS,
              'top-1/2 -right-1.5 h-10 w-3 -translate-y-1/2 cursor-ew-resize rounded-full',
              selected && 'opacity-100',
            )}
          />
          <span
            {...dragProps}
            aria-hidden
            className={cn(
              HANDLE_CLASS,
              '-right-1.5 -bottom-1.5 size-3.5 cursor-nwse-resize rounded-full',
              selected && 'opacity-100',
            )}
          />
          <div
            {...{ [IMAGE_CONTROL]: '' }}
            className={cn(
              'absolute top-2 right-2 opacity-0 transition-opacity group-hover/image:opacity-100 focus-within:opacity-100',
              selected && 'opacity-100',
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" iconOnly raised={false} aria-label="Image actions">
                  <DotsThree />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onCloseAutoFocus={keepFocus}>
                {actions(DROPDOWN_MENU_PARTS)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );

  return (
    <NodeViewWrapper className="my-2" contentEditable={false}>
      <div ref={column}>
        {editable
          ? (
            <ContextMenu>
              <ContextMenuTrigger asChild>{image}</ContextMenuTrigger>
              <ContextMenuContent onCloseAutoFocus={keepFocus}>
                {actions(CONTEXT_MENU_PARTS)}
              </ContextMenuContent>
            </ContextMenu>
          )
          : image}
      </div>
      {editingAlt && (
        <AltTextDialog
          alt={alt}
          onClose={() => {
            setEditingAlt(false);
            select();
            editor.commands.focus();
          }}
          onSave={(next) => {
            updateAttributes({ alt: next });
          }}
        />
      )}
    </NodeViewWrapper>
  );
}

function AltTextDialog(
  { alt, onSave, onClose }: {
    alt: string | null;
    onSave: (alt: string | null) => void;
    onClose: () => void;
  },
) {
  const [value, setValue] = useState(alt ?? '');
  const save = (event?: SyntheticEvent) => {
    event?.preventDefault();
    onSave(imageAlt(value));
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
        title="Alt text"
        description="Describe the image for people who can't see it. Leave it empty if it's only decoration."
        footer={
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              Save alt text
            </Button>
          </>
        }
      >
        <form onSubmit={save}>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus -- the dialog exists to type this */}
          <Input
            autoFocus
            value={value}
            maxLength={ALT_MAX_LENGTH}
            onFocus={(event) => {
              return event.currentTarget.select();
            }}
            onChange={(event) => {
              return setValue(event.target.value);
            }}
            placeholder="e.g. Diagram of the code graph flowing into Neo4j"
            aria-label="Alt text"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
