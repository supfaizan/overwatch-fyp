'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import FormField from '@/shared/components/form-field';
import { Input, TextArea } from '@/shared/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import { CheckCircle } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { useId, useState } from 'react';
import { useApplyProposal, useCancelProposal } from '../hooks';
import type { Proposal } from '../types';

const KINDS = {
  work_item: { name: 'ticket', body: 'Description' },
  document: { name: 'page', body: 'Content' },
  decision: { name: 'decision', body: 'Background' },
};

/**
 * A ticket, page or decision the AI drafted. Nothing exists until the asker approves it here, after
 * editing it if they like; then it shows what was created.
 */
export default function ProposalCard({ proposal }: { proposal: Proposal }) {
  const [fields, setFields] = useState(proposal.fields);
  const apply = useApplyProposal();
  const cancel = useCancelProposal();
  const id = useId();
  const kind = KINDS[proposal.kind];

  if (proposal.status === 'applied' && proposal.result) {
    return (
      <p className="flex items-center gap-1.5 px-1 text-sm">
        <CheckCircle weight="fill" className="size-4 shrink-0 text-success" aria-hidden />
        Created the {kind.name}
        <Link
          href={proposal.result.href}
          className="truncate font-medium text-primary hover:underline"
        >
          {proposal.result.title}
        </Link>
      </p>
    );
  }
  if (proposal.status === 'cancelled' || proposal.status === 'expired') {
    return (
      <p className="px-1 text-xs text-muted">
        {proposal.status === 'cancelled'
          ? `Draft ${kind.name} cancelled.`
          : `This draft ${kind.name} expired. Ask again for a new one.`}
      </p>
    );
  }

  const set = (changes: Partial<typeof fields>) => {
    setFields({ ...fields, ...changes });
  };
  const noBoard = proposal.kind === 'work_item' && proposal.boards.length === 0;
  const error = apply.error ?? cancel.error;

  return (
    <Card className="flex w-full flex-col gap-3 text-sm">
      <header>
        <h3 className="font-semibold">Draft {kind.name}</h3>
        <p className="text-xs text-muted">Nothing is created until you approve it.</p>
      </header>
      <FormField id={`${id}-title`} label="Title">
        <Input
          id={`${id}-title`}
          value={fields.title}
          maxLength={200}
          onChange={(event) => {
            return set({ title: event.target.value });
          }}
        />
      </FormField>
      {proposal.kind === 'decision' && (
        <FormField id={`${id}-statement`} label="Statement">
          <TextArea
            id={`${id}-statement`}
            rows={2}
            value={fields.statement}
            maxLength={2000}
            onChange={(event) => {
              return set({ statement: event.target.value });
            }}
          />
        </FormField>
      )}
      <FormField id={`${id}-body`} label={kind.body}>
        <TextArea
          id={`${id}-body`}
          rows={5}
          value={fields.body}
          maxLength={20_000}
          onChange={(event) => {
            return set({ body: event.target.value });
          }}
        />
      </FormField>
      {proposal.kind === 'work_item' && (
        <FormField
          id={`${id}-board`}
          label="Board"
          hint={noBoard ? 'No board can take new tickets right now.' : undefined}
        >
          <Select
            value={fields.board_id ?? undefined}
            onValueChange={(boardId) => {
              return set({ board_id: boardId });
            }}
            disabled={noBoard}
          >
            <SelectTrigger id={`${id}-board`} size="sm" />
            <SelectContent>
              {proposal.boards.map((board) => {
                return <SelectItem key={board.id} value={board.id}>{board.name}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </FormField>
      )}
      {error && <Banner type="error" className="text-xs">{error.message}</Banner>}
      <footer className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="tertiary"
          loading={cancel.isPending}
          disabled={apply.isPending}
          onClick={() => {
            return cancel.mutate(proposal.id);
          }}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          loading={apply.isPending || proposal.status === 'applying'}
          disabled={noBoard || !fields.title.trim() || cancel.isPending}
          onClick={() => {
            return apply.mutate({ id: proposal.id, fields });
          }}
        >
          Approve
        </Button>
      </footer>
    </Card>
  );
}
