'use client';

import Button from '@/shared/components/button';
import { Dialog, DialogClose, DialogContent } from '@/shared/components/dialog';
import FormField from '@/shared/components/form-field';
import { Input, TextArea } from '@/shared/components/input';
import { useUpdateDecision } from '@/shared/decisions/hooks';
import type { Decision } from '@/shared/decisions/types';
import { type FormEvent, useState } from 'react';

/** Reword a decision: its title, what was decided, the background and its area. */
export default function EditDecisionDialog(
  { decision, onOpenChange }: { decision: Decision; onOpenChange: (open: boolean) => void },
) {
  const [title, setTitle] = useState(decision.title);
  const [statement, setStatement] = useState(decision.statement);
  const [context, setContext] = useState(decision.context_md ?? '');
  const [area, setArea] = useState(decision.area ?? '');
  const update = useUpdateDecision();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    update.mutate(
      {
        id: decision.id,
        title: title.trim(),
        statement: statement.trim(),
        context_md: context.trim() || null,
        area: area.trim() || null,
      },
      {
        onSuccess: () => {
          return onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        title="Edit decision"
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              type="submit"
              form="edit-decision"
              loading={update.isPending}
              disabled={!title.trim() || !statement.trim()}
            >
              Save
            </Button>
          </>
        }
      >
        <form id="edit-decision" onSubmit={submit} className="flex flex-col gap-3">
          <FormField id="edit-title" label="Decision">
            <Input
              id="edit-title"
              maxLength={200}
              value={title}
              onChange={(e) => {
                return setTitle(e.target.value);
              }}
            />
          </FormField>
          <FormField id="edit-statement" label="What was decided">
            <TextArea
              id="edit-statement"
              rows={3}
              maxLength={2000}
              value={statement}
              onChange={(e) => {
                return setStatement(e.target.value);
              }}
            />
          </FormField>
          <FormField id="edit-context" label="Background (optional, Markdown)">
            <TextArea
              id="edit-context"
              rows={4}
              maxLength={20000}
              value={context}
              onChange={(e) => {
                return setContext(e.target.value);
              }}
            />
          </FormField>
          <FormField id="edit-area" label="Area (optional)">
            <Input
              id="edit-area"
              maxLength={60}
              value={area}
              onChange={(e) => {
                return setArea(e.target.value);
              }}
            />
          </FormField>
        </form>
      </DialogContent>
    </Dialog>
  );
}
