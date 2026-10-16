'use client';

import Button from '@/shared/components/button';
import { toast } from 'sonner';

export function Feedback() {
  return (
    <>
      <Button
        onClick={() => {
          return toast('Dashboard saved', { description: 'All changes are live.' });
        }}
      >
        Default
      </Button>
      <Button
        onClick={() => {
          return toast.success('Repository connected');
        }}
      >
        Success
      </Button>
      <Button
        onClick={() => {
          return toast.error('Could not reach GitHub');
        }}
      >
        Error
      </Button>
    </>
  );
}

export function AsyncWork() {
  const parse = () => {
    return new Promise((resolve) => {
      return setTimeout(resolve, 1500);
    });
  };
  return (
    <Button
      onClick={() => {
        return toast.promise(parse(), {
          loading: 'Parsing repository...',
          success: 'Graph ready',
          error: 'Parse failed',
        });
      }}
    >
      Parse repository
    </Button>
  );
}
