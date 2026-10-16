'use client';

import Button from '@/shared/components/button';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import { useState } from 'react';

export function Disconnect() {
  const [pending, setPending] = useState(false);
  return (
    <ConfirmDialog
      trigger={<Button size="sm">Disconnect</Button>}
      title="Disconnect acme/api?"
      description="Its diagram and index are removed. You can connect it again later."
      confirmLabel="Disconnect"
      pending={pending}
      onConfirm={(close) => {
        setPending(true);
        setTimeout(() => {
          setPending(false);
          close();
        }, 800);
      }}
    />
  );
}
