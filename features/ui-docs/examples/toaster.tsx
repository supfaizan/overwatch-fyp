'use client';

import Button from '@/shared/components/button';
import { toast } from 'sonner';

export function Feedback() {
  return (
    <>
      <Button onClick={() => toast('Dashboard saved', { description: 'All changes are live.' })}>
        Default
      </Button>
      <Button onClick={() => toast.success('Repository connected')}>Success</Button>
      <Button onClick={() => toast.error('Could not reach GitHub')}>Error</Button>
    </>
  );
}

export function AsyncWork() {
  const parse = () => new Promise((resolve) => setTimeout(resolve, 1500));
  return (
    <Button
      onClick={() =>
        toast.promise(parse(), {
          loading: 'Parsing repository...',
          success: 'Graph ready',
          error: 'Parse failed',
        })}
    >
      Parse repository
    </Button>
  );
}
