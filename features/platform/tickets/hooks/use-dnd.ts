"use client";

/* Native HTML5 drag-and-drop wrapped once, so tickets and sections share one
   implementation. The payload lives in the store rather than in dataTransfer
   because `getData` is unreadable during dragover — targets need to know what
   is in flight to decide whether they accept it. */

import { useState, type DragEvent } from "react";
import {
  useTicketsStore,
  type DragKind,
  type DragPayload,
} from "../stores/tickets-store";

/** Firefox will not start a drag unless some data is set. */
const MIME = "application/x-overwatch-board";

export function useDraggable(payload: DragPayload) {
  const setActive = useTicketsStore((s) => s.setActive);
  const active = useTicketsStore((s) => s.active);

  return {
    isDragging: active?.kind === payload.kind && active.id === payload.id,
    dragProps: {
      draggable: true,
      onDragStart: (e: DragEvent<HTMLElement>) => {
        e.stopPropagation();
        e.dataTransfer.setData(MIME, payload.id);
        e.dataTransfer.effectAllowed = "move";
        setActive(payload);
      },
      onDragEnd: () => setActive(null),
    },
  };
}

interface DroppableOptions {
  accept: DragKind;
  onDrop: (payload: DragPayload) => void;
  /** Skip the drop (e.g. a card hovering over itself). */
  disabled?: boolean;
}

export function useDroppable({ accept, onDrop, disabled }: DroppableOptions) {
  const active = useTicketsStore((s) => s.active);
  const [isOver, setIsOver] = useState(false);
  const canDrop = !disabled && active?.kind === accept;

  return {
    /** Only true while a compatible payload is overhead. */
    isOver: isOver && Boolean(canDrop),
    canDrop: Boolean(canDrop),
    dropProps: {
      onDragOver: (e: DragEvent<HTMLElement>) => {
        if (!canDrop) return;
        e.preventDefault(); // marks this element as a valid drop target
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        setIsOver(true);
      },
      onDragLeave: (e: DragEvent<HTMLElement>) => {
        // Ignore leaves fired while crossing into a child element.
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setIsOver(false);
      },
      onDrop: (e: DragEvent<HTMLElement>) => {
        setIsOver(false);
        if (!canDrop || !active) return;
        e.preventDefault();
        e.stopPropagation(); // a card drop must not also hit its column
        onDrop(active);
      },
    },
  };
}
