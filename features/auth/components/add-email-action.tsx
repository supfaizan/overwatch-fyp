'use client';

import Button from '@/shared/components/button';
import { useState } from 'react';
import type { MergePreview } from '../api';
import AddEmailDialog from './add-email-dialog';
import MergeDialog from './merge-dialog';

/** "Add this address to your account", for an invite sent to an email the signed-in account doesn't have yet. */
export default function AddEmailAction({ email, onAdded }: { email: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [merge, setMerge] = useState<MergePreview | null>(null);
  return (
    <>
      <Button
        variant="primary"
        onClick={() => {
          setOpen(true);
        }}
      >
        Add {email} to your account
      </Button>
      <AddEmailDialog
        open={open}
        onOpenChange={setOpen}
        email={email}
        onAdded={onAdded}
        onMerge={setMerge}
      />
      <MergeDialog
        preview={merge}
        onClose={() => {
          setMerge(null);
        }}
        onMerged={onAdded}
      />
    </>
  );
}
