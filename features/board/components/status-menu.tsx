'use client';

import Button from '@/shared/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/dropdown-menu';
import Spinner from '@/shared/components/spinner';
import Tag from '@/shared/components/tag';
import { cn } from '@/shared/lib/cn';
import { ArrowRight, ArrowSquareOut, CaretDown, FlowArrow } from '@phosphor-icons/react/ssr';
import { useItemMoves } from '../hooks';
import {
  COLOR_CLASSES,
  itemStatusColor,
  movesFrom,
  type StatusOption,
  statusOptions,
} from '../lib';
import { type Board, type ColumnColor, NATIVE_SOURCE, type WorkItem } from '../types';

/** A status button's fill, like Jira's; gray keeps the secondary button's own colors. */
const FILLS: Record<ColumnColor, { bg: string; text: string } | null> = {
  gray: null,
  blue: { bg: 'var(--color-accent-blue)', text: 'var(--color-white)' },
  green: { bg: 'var(--color-success)', text: 'var(--color-white)' },
  red: { bg: 'var(--color-danger)', text: 'var(--color-white)' },
  amber: { bg: 'var(--color-accent-amber)', text: 'var(--color-foreground)' },
  purple: { bg: 'var(--color-accent-purple)', text: 'var(--color-white)' },
  orange: { bg: 'var(--color-accent-orange)', text: 'var(--color-white)' },
  slate: { bg: 'var(--color-accent-slate)', text: 'var(--color-white)' },
};

type StatusMenuProps = {
  item: WorkItem;
  board: Board;
  trackerName: string | null;
  /** A move is being saved: the button shows a spinner. */
  pending: boolean;
  onMove: (option: StatusOption) => void;
  /** Native boards, for admins: opens the board's workflow. */
  onViewWorkflow?: () => void;
};

/**
 * An item's status as a colored button that opens the moves it can make from there, Jira-style:
 * "Peer Review → In Review". Only allowed moves are listed; the server still checks each one.
 */
export default function StatusMenu(
  { item, board, trackerName, pending, onMove, onViewWorkflow }: StatusMenuProps,
) {
  // read when the ticket opens, so the menu is usually ready by the time it's clicked
  const live = useItemMoves(item, true);
  const tracker = item.source !== NATIVE_SOURCE;
  const moves = movesFrom(board, item, live.data);
  const options = statusOptions(board.columns, item, moves ? [...moves.values()].flat() : null);
  const current = item.status
    ?? board.columns.find((column) => {
      return column.id === item.column_id;
    })?.name
    ?? 'No status';
  const fill = FILLS[itemStatusColor(board.columns, item)];
  const edge = fill && `color-mix(in oklab, ${fill.bg}, black 25%)`;

  const body = () => {
    // a tracker's stored workflow can be out of date, so its moves wait for the tracker's answer
    if (tracker && live.isPending) {
      return (
        <DropdownMenuItem disabled>
          <Spinner aria-hidden /> Loading transitions…
        </DropdownMenuItem>
      );
    }
    if (live.isError) {
      return (
        <DropdownMenuItem disabled>
          Couldn’t load transitions: {live.error.message}
        </DropdownMenuItem>
      );
    }
    if (!options.length) {
      return <DropdownMenuItem disabled>No transitions from here</DropdownMenuItem>;
    }
    return options.map((option) => {
      const needsInput = option.requiredFields.length > 0;
      return (
        <DropdownMenuItem
          key={`${option.columnId}|${option.statusId ?? ''}`}
          disabled={needsInput}
          // on the menu's columns, so every row's arrow and status line up; grows for a "Needs …" line
          className="grid h-auto min-h-9 grid-cols-subgrid items-center gap-x-3 gap-y-0.5 py-1.5"
          onSelect={() => {
            return onMove(option);
          }}
        >
          <span className="min-w-0 truncate">{option.transitionName ?? 'Transition to'}</span>
          <ArrowRight aria-hidden />
          <Tag className={cn('justify-self-start', COLOR_CLASSES[option.color].tag)}>
            {option.label}
          </Tag>
          {needsInput && (
            <span className="col-span-full text-xs">
              Needs {option.requiredFields.join(', ')}: make this move in {trackerName}
            </span>
          )}
        </DropdownMenuItem>
      );
    });
  };

  return (
    // not modal: a modal menu blocks the page, so a click on the trigger to close it reached the
    // ticket dialog's backdrop and closed the ticket too
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild disabled={!item.editable}>
        <Button
          className="self-start"
          bg={fill?.bg}
          text={fill?.text}
          border={edge ?? undefined}
          edge={edge ?? undefined}
          loading={pending}
          aria-label={`Status: ${current}. Change status`}
        >
          {current}
          <CaretDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        // columns for the moves' name, arrow and status; anything else spans them
        className="grid min-w-72 grid-cols-[1fr_auto_auto] gap-x-3 [&>*]:col-span-full"
      >
        {body()}
        {(onViewWorkflow || (tracker && item.external_url)) && <DropdownMenuSeparator />}
        {onViewWorkflow && (
          <DropdownMenuItem onSelect={onViewWorkflow}>
            <FlowArrow /> View workflow
          </DropdownMenuItem>
        )}
        {tracker && item.external_url && (
          <DropdownMenuItem asChild>
            <a href={item.external_url} target="_blank" rel="noopener noreferrer">
              <ArrowSquareOut /> Open in {trackerName}
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
