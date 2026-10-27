import {
  type CheckInterval,
  type Decision,
  type DecisionStatus,
  type Evidence,
  EVIDENCE_KIND,
  EVIDENCE_STATE,
  type EvidenceState,
} from './types';

export const STATUS_LABELS: Record<DecisionStatus, string> = {
  open: 'Open',
  proposed: 'Proposed',
  accepted: 'Accepted',
  rejected: 'Rejected',
  superseded: 'Superseded',
};

export const STATUS_TAGS: Record<DecisionStatus, 'default' | 'primary' | 'success' | 'danger'> = {
  open: 'default',
  proposed: 'primary',
  accepted: 'success',
  rejected: 'danger',
  superseded: 'default',
};

export const CHECK_INTERVAL_LABELS: Record<CheckInterval, string> = {
  30: 'Every 30 minutes',
  60: 'Every hour',
  720: 'Every 12 hours',
  1440: 'Every 24 hours',
};

export const EVIDENCE_STATE_LABELS: Record<EvidenceState, string> = {
  current: 'Up to date',
  changed: 'Source edited since',
  quote_missing: 'No longer in the source',
  source_gone: 'Source deleted',
};

const BROKEN: EvidenceState[] = [EVIDENCE_STATE.quoteMissing, EVIDENCE_STATE.sourceGone];

/** Whether the evidence's source no longer says what it was quoted for. */
export function isBroken(evidence: Evidence): boolean {
  return BROKEN.includes(evidence.state);
}

export function hasBrokenEvidence(decision: Decision): boolean {
  return decision.evidence.some(isBroken);
}

/** Today as an ISO date in the viewer's time zone, to compare review dates with. */
export function localToday(): string {
  return new Date().toLocaleDateString('en-CA');
}

/** Where a piece of evidence opens in the app: its page, or its item on the board it's on. */
export function evidenceHref(evidence: Evidence): string {
  if (evidence.kind === EVIDENCE_KIND.document) {
    return `/documents/${evidence.ref_id}`;
  }
  // the board's address params (features/board): which board, and which item is open
  const params = new URLSearchParams({
    ...(evidence.board_id && { board: evidence.board_id }),
    item: evidence.item_key ?? '',
  });
  return `/board?${params}`;
}
