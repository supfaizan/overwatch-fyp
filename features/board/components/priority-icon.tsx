import { cn } from '@/shared/lib/cn';
import {
  CaretDoubleDown,
  CaretDoubleUp,
  CaretDown,
  CaretUp,
  Equals,
} from '@phosphor-icons/react/ssr';
import { priorityLevel } from '../lib';
import type { PriorityLevel } from '../types';

const ICONS: Record<PriorityLevel, { icon: typeof CaretUp; color: string }> = {
  highest: { icon: CaretDoubleUp, color: 'text-danger' },
  high: { icon: CaretUp, color: 'text-accent-orange' },
  medium: { icon: Equals, color: 'text-warning-strong' },
  low: { icon: CaretDown, color: 'text-accent-blue' },
  lowest: { icon: CaretDoubleDown, color: 'text-accent-slate' },
};

/** A priority's arrow, Jira-style; nothing for a priority name we can't place. Labelled with the name. */
export default function PriorityIcon(
  { priority, className }: { priority: string | null; className?: string },
) {
  const level = priorityLevel(priority);
  if (!level || !priority) {
    return null;
  }
  const { icon: Icon, color } = ICONS[level];
  return (
    <Icon weight="bold" aria-label={priority} className={cn('size-4 shrink-0', color, className)} />
  );
}
