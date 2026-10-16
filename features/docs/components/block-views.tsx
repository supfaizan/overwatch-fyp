'use client';

import { cn } from '@/shared/lib/cn';
import {
  CaretRight,
  CheckCircle,
  type Icon,
  Info,
  Note,
  Warning,
  XCircle,
} from '@phosphor-icons/react';
import { NodeViewContent, type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import type { PanelType } from '../blocks';
import { emojiGlyph } from '../inline-nodes';
import { plainColor } from '../lib';

const PANELS: Record<PanelType, { icon: Icon | null; className: string }> = {
  info: { icon: Info, className: 'bg-accent-blue/10 text-accent-blue' },
  note: { icon: Note, className: 'bg-accent-purple/10 text-accent-purple' },
  success: { icon: CheckCircle, className: 'bg-success/10 text-success' },
  warning: { icon: Warning, className: 'bg-warning/15 text-warning-strong' },
  error: { icon: XCircle, className: 'bg-danger/10 text-danger' },
  custom: { icon: null, className: 'bg-fill-hover text-muted' },
};

/** A coloured callout; a custom one shows its own emoji and colour. */
export function PanelView({ node }: NodeViewProps) {
  const type: PanelType = node.attrs.panelType in PANELS ? node.attrs.panelType : 'info';
  const { icon: Glyph, className } = PANELS[type];
  const emoji = node.attrs.panelIconId || node.attrs.panelIconText
    ? emojiGlyph({
      id: node.attrs.panelIconId,
      text: node.attrs.panelIconText,
      shortName: node.attrs.panelIcon,
    })
    : '';
  const color = type === 'custom' ? plainColor(node.attrs.panelColor) : undefined;
  return (
    <NodeViewWrapper
      data-panel={type}
      className={cn('my-2 flex gap-3 rounded-md px-4 py-3', className)}
      style={color
        ? { backgroundColor: `color-mix(in srgb, ${color} 35%, transparent)` }
        : undefined}
    >
      <span contentEditable={false} className="mt-0.5 shrink-0 select-none" aria-hidden>
        {emoji
          ? <span className="text-base leading-none">{emoji}</span>
          : Glyph && <Glyph weight="fill" className="size-5" />}
      </span>
      <NodeViewContent className="min-w-0 flex-1 text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" />
    </NodeViewWrapper>
  );
}

/** A section that folds away under its title; open while it's edited, as anyone opens it. */
export function ExpandView({ node, updateAttributes, editor }: NodeViewProps) {
  const [open, setOpen] = useState(true);
  return (
    <NodeViewWrapper data-expand="" className="my-2 rounded-md border border-border">
      <div contentEditable={false} className="flex items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? 'Collapse section' : 'Expand section'}
          onClick={() => {
            return setOpen((value) => {
              return !value;
            });
          }}
          className="cursor-pointer rounded p-1 text-muted hover:bg-fill-hover hover:text-foreground"
        >
          <CaretRight className={cn('size-3.5 transition-transform', open && 'rotate-90')} />
        </button>
        <input
          value={node.attrs.title ?? ''}
          readOnly={!editor.isEditable}
          onChange={(event) => {
            return updateAttributes({ title: event.target.value });
          }}
          placeholder="Title"
          aria-label="Section title"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted"
        />
      </div>
      <NodeViewContent className={cn('px-4 pb-3 [&>*:first-child]:mt-0', !open && 'hidden')} />
    </NodeViewWrapper>
  );
}
