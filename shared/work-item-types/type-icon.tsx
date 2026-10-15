import {
  BookmarkSimple, Bug, CheckSquare, Circle, Code, FileText, Flag, Flask, Gear, Lightbulb, Lightning, Megaphone,
  PaintBrush, PuzzlePiece, Question, Rocket, ShieldCheck, Star, Target, TreeStructure, Wrench,
} from '@phosphor-icons/react/ssr';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/cn';
import type { TypeColor, TypeIcon as TypeIconName, WorkItemType } from './types';

export const ICONS: Record<TypeIconName, Icon> = {
  CheckSquare, Bug, Flask, BookmarkSimple, Lightning, TreeStructure, Star, Flag, Wrench, Rocket, Lightbulb,
  ShieldCheck, Gear, PaintBrush, FileText, Megaphone, Question, Target, PuzzlePiece, Code, Circle,
};

/** Each type color as an icon tint and a swatch, from the theme's tokens (both themes). */
export const TYPE_COLOR_CLASSES: Record<TypeColor, { text: string; swatch: string }> = {
  gray: { text: 'text-muted', swatch: 'bg-border-strong' },
  blue: { text: 'text-accent-blue', swatch: 'bg-accent-blue' },
  green: { text: 'text-success', swatch: 'bg-success' },
  red: { text: 'text-danger', swatch: 'bg-danger' },
  amber: { text: 'text-accent-amber', swatch: 'bg-accent-amber' },
  purple: { text: 'text-accent-purple', swatch: 'bg-accent-purple' },
  orange: { text: 'text-accent-orange', swatch: 'bg-accent-orange' },
  slate: { text: 'text-accent-slate', swatch: 'bg-accent-slate' },
};

/** An item's type; a native item from before types counts as the workspace's Task (or its first type). */
export function typeOf(types: WorkItemType[] | undefined, typeId: string | null | undefined): WorkItemType | undefined {
  if (!types?.length) return undefined;
  return types.find((type) => type.id === typeId) ?? (typeId ? undefined : (types.find((type) => type.name.toLowerCase() === 'task') ?? types[0]));
}

type TypeIconProps = {
  type: Pick<WorkItemType, 'icon' | 'color' | 'name'>;
  /** @default 'size-4' */
  className?: string;
};

/** A work item type's icon in its color, named for screen readers. */
export default function TypeIcon({ type, className = 'size-4' }: TypeIconProps) {
  const Glyph = ICONS[type.icon] ?? Circle;
  return <Glyph weight="bold" role="img" aria-label={type.name} className={cn('shrink-0', TYPE_COLOR_CLASSES[type.color].text, className)} />;
}
