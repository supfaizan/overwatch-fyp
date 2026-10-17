'use client';

import Avatar from '@/shared/components/avatar';
import Button from '@/shared/components/button';
import {
  CONTEXT_MENU_PARTS,
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/shared/components/context-menu';
import {
  DROPDOWN_MENU_PARTS,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  type MenuParts,
} from '@/shared/components/dropdown-menu';
import Tag from '@/shared/components/tag';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { useWorkItemTypes } from '@/shared/work-item-types/hooks';
import TypeIcon, { typeOf } from '@/shared/work-item-types/type-icon';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, DotsThree, LinkSimple, Lock } from '@phosphor-icons/react/ssr';
import { memo, useState } from 'react';
import { toast } from 'sonner';
import { useItemMoves, usePrefetchMoves } from '../hooks';
import { COLOR_CLASSES, columnColor } from '../lib';
import { type Column, COLUMN_COLOR, type ColumnColor, type WorkItem } from '../types';
import PriorityIcon from './priority-icon';

type WorkItemCardProps = {
  item: WorkItem;
  columns: Column[];
  /** its column's color, for the card's bottom edge */
  color?: ColumnColor;
  onOpen: (item: WorkItem) => void;
  /** Keyboard- and screen-reader-friendly alternative to dragging. */
  onMoveTo: (item: WorkItem, columnId: string) => void;
  /** The address that opens the item, for "Copy link". */
  linkOf: (item: WorkItem) => string;
};

export default function WorkItemCard(
  { item, columns, color, onOpen, onMoveTo, linkOf }: WorkItemCardProps,
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !item.editable,
  });
  const prefetchMoves = usePrefetchMoves();

  return (
    <li
      ref={setNodeRef}
      // where it can move, read before a drag starts so the hints are ready
      onPointerEnter={() => {
        return prefetchMoves(item);
      }}
      onFocus={() => {
        return prefetchMoves(item);
      }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('list-none', isDragging && 'opacity-40')}
    >
      <CardBody
        item={item}
        columns={columns}
        color={color}
        onOpen={onOpen}
        onMoveTo={onMoveTo}
        linkOf={linkOf}
        attributes={attributes}
        listeners={listeners}
      />
    </li>
  );
}

type CardBodyProps = WorkItemCardProps & {
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
};

function copy(text: string, what: string) {
  navigator.clipboard.writeText(text).then(
    () => {
      return toast.success(`${what} copied.`);
    },
    () => {
      return toast.error(`Could not copy the ${what.toLowerCase()}.`);
    },
  );
}

/**
 * The card itself, also rendered in the drag overlay. Memoised: every sortable re-renders on each
 * pointer move of a drag, and with hundreds of cards that would stall the drag itself.
 */
export const CardBody = memo(
  function CardBody(
    { item, columns, color = COLUMN_COLOR.gray, onOpen, onMoveTo, linkOf, attributes, listeners }:
      CardBodyProps,
  ) {
    const type = typeOf(useWorkItemTypes().data, item.type_id);
    const [menuOpen, setMenuOpen] = useState(false);
    const moves = useItemMoves(item, menuOpen);

    const actions = ({ Item, Label, Separator }: MenuParts) => {
      return (
        <>
          {item.editable && (
            <>
              <Label>Move to</Label>
              {columns.filter((column) => {
                return column.id !== item.column_id;
              }).map((column) => {
                // until the moves are read, every column is offered; the server checks the move either way
                const blocked = moves.data && moves.data.basis !== 'open'
                  && !moves.data.targets.some((target) => {
                    return target.column_id === column.id;
                  });
                return (
                  <Item
                    key={column.id}
                    disabled={Boolean(blocked)}
                    onSelect={() => {
                      return onMoveTo(item, column.id);
                    }}
                  >
                    <Tag className={COLOR_CLASSES[columnColor(column)].tag}>{column.name}</Tag>
                  </Item>
                );
              })}
              <Separator />
            </>
          )}
          <Item
            onSelect={() => {
              return copy(linkOf(item), 'Link');
            }}
          >
            <LinkSimple /> Copy link
          </Item>
          <Item
            onSelect={() => {
              return copy(item.key, 'Key');
            }}
          >
            <Copy /> Copy key
          </Item>
        </>
      );
    };

    return (
      // the whole card opens it; a drag only starts after a few pixels of travel, so a click stays a click
      <ContextMenu onOpenChange={setMenuOpen}>
        <ContextMenuTrigger asChild>
          <article
            {...attributes}
            {...listeners}
            onClick={() => {
              return onOpen(item);
            }}
            className={cn(
              'group flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-sm shadow-chrome',
              COLOR_CLASSES[color].edge,
            )}
          >
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="font-medium">{item.key}</span>
              {!item.editable && (
                <Tooltip content="Read-only: reconnect the tracker in Settings → Integrations to edit it here">
                  <Lock className="size-3.5" aria-label="Read-only" />
                </Tooltip>
              )}
              <span className="flex-1" />
              <DropdownMenu onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="tertiary"
                    size="sm"
                    iconOnly
                    aria-label={`Actions for ${item.key}`}
                    className="size-6"
                    onPointerDown={(event) => {
                      return event.stopPropagation();
                    }}
                    onClick={(event) => {
                      return event.stopPropagation();
                    }}
                  >
                    <DotsThree />
                  </Button>
                </DropdownMenuTrigger>
                {/* React events bubble through portals: a pick here mustn't also open the card */}
                <DropdownMenuContent
                  align="end"
                  onClick={(event) => {
                    return event.stopPropagation();
                  }}
                >
                  {actions(DROPDOWN_MENU_PARTS)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* a real button for keyboards: Enter on it clicks, and the click reaches the card */}
            <button
              type="button"
              className="text-left font-medium hover:underline focus-visible:underline"
            >
              {item.title}
            </button>
            {(type || item.status || item.priority || item.assignee?.name) && (
              <div className="flex items-center gap-2">
                {type && (
                  <Tooltip content={type.name}>
                    <span className="inline-flex">
                      <TypeIcon type={type} />
                    </span>
                  </Tooltip>
                )}
                {item.status && <Tag>{item.status}</Tag>}
                <span className="flex-1" />
                {item.priority && (
                  <Tooltip content={`${item.priority} priority`}>
                    <span className="inline-flex">
                      <PriorityIcon priority={item.priority} />
                    </span>
                  </Tooltip>
                )}
                {item.assignee?.name && (
                  <Tooltip content={item.assignee.name}>
                    <Avatar name={item.assignee.name} size="sm" />
                  </Tooltip>
                )}
              </div>
            )}
          </article>
        </ContextMenuTrigger>
        <ContextMenuContent
          onClick={(event) => {
            return event.stopPropagation();
          }}
        >
          {actions(CONTEXT_MENU_PARTS)}
        </ContextMenuContent>
      </ContextMenu>
    );
  },
);
