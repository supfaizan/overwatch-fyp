'use client';

import Button from '@/shared/components/button';
import { Dialog, DialogClose, DialogContent } from '@/shared/components/dialog';
import FormField, { describedBy } from '@/shared/components/form-field';
import { Input, TextArea } from '@/shared/components/input';
import SegmentedButton from '@/shared/components/segmented-button';
import { type FormEvent, useState } from 'react';
import { useCreateDecision } from './hooks';
import { DECISION_STATUS, type EvidenceKind } from './types';

/** The item or page a decision is recorded from; its passage becomes the first evidence. */
export type DecisionSource = { kind: EvidenceKind; refId: string; title: string };

type RecordDecisionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where it's recorded from; without one the decision starts with no evidence. */
  source?: DecisionSource;
  /** The passage to quote, e.g. the text selected on the page. */
  quote?: string;
  onRecorded?: (decisionId: string) => void;
};

const STATUSES = [
  { value: DECISION_STATUS.open, label: 'Still open' },
  { value: DECISION_STATUS.accepted, label: 'Agreed' },
];
const QUOTE_ERROR = 'evidence.0.quote';

/** Record a decision, quoting the passage from the item or page it comes from. */
export default function RecordDecisionDialog(
  { open, onOpenChange, source, quote: initialQuote = '', onRecorded }: RecordDecisionDialogProps,
) {
  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('');
  const [area, setArea] = useState('');
  const [quote, setQuote] = useState(initialQuote);
  const [status, setStatus] = useState<string>(DECISION_STATUS.open);
  const create = useCreateDecision();
  const quoteError = create.error?.fields[QUOTE_ERROR];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      {
        title: title.trim(),
        statement: statement.trim(),
        area: area.trim() || null,
        status: status === DECISION_STATUS.accepted
          ? DECISION_STATUS.accepted
          : DECISION_STATUS.open,
        evidence: source && quote.trim()
          ? [{ kind: source.kind, ref_id: source.refId, quote: quote.trim() }]
          : [],
      },
      {
        onSuccess: (decision) => {
          onOpenChange(false);
          onRecorded?.(decision.id);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Record decision"
        description={source ? `From ${source.title}` : undefined}
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              type="submit"
              form="record-decision"
              loading={create.isPending}
              disabled={!title.trim() || !statement.trim()}
            >
              Record
            </Button>
          </>
        }
      >
        <form id="record-decision" onSubmit={submit} className="flex flex-col gap-3">
          <FormField id="decision-title" label="Decision">
            <Input
              id="decision-title"
              placeholder="e.g. Guest export"
              maxLength={200}
              value={title}
              onChange={(e) => {
                return setTitle(e.target.value);
              }}
              autoFocus
            />
          </FormField>
          <FormField id="decision-statement" label="What was decided">
            <TextArea
              id="decision-statement"
              placeholder="e.g. Guests can't export reports; only admins can."
              rows={3}
              maxLength={2000}
              value={statement}
              onChange={(e) => {
                return setStatement(e.target.value);
              }}
            />
          </FormField>
          {source && (
            <FormField
              id="decision-quote"
              label="Passage it rests on"
              hint="Copied from the item or page as written; select text there before recording to fill it in."
              error={quoteError}
            >
              <TextArea
                rows={3}
                maxLength={2000}
                value={quote}
                onChange={(e) => {
                  return setQuote(e.target.value);
                }}
                {...describedBy('decision-quote', quoteError, true)}
              />
            </FormField>
          )}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <FormField id="decision-area" label="Area (optional)">
              <Input
                id="decision-area"
                placeholder="e.g. Billing"
                maxLength={60}
                value={area}
                onChange={(e) => {
                  return setArea(e.target.value);
                }}
              />
            </FormField>
            <SegmentedButton
              aria-label="Status"
              size="sm"
              options={STATUSES}
              value={status}
              onValueChange={setStatus}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
