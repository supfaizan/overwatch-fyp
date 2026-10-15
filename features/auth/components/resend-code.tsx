'use client';

import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/api/envelope';
import Button from '@/shared/components/button';
import { resendCode } from '../api';
import { setResendAt, type Challenge } from '../challenge';
import { AUTH_ERROR } from '../constants';

function secondsUntil(at: number): number {
  return Math.max(0, Math.ceil((at - Date.now()) / 1000));
}

/** "Resend code", counting down until the server allows another. */
export default function ResendCode({ challenge, onResent, onExpired }: { challenge: Challenge; onResent?: () => void; onExpired: () => void }) {
  const [resendAt, setAt] = useState(challenge.resendAt);
  const [left, setLeft] = useState(() => secondsUntil(challenge.resendAt));

  useEffect(() => {
    setLeft(secondsUntil(resendAt));
    const timer = setInterval(() => setLeft(secondsUntil(resendAt)), 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  const restart = (seconds: number) => {
    setResendAt(seconds);
    setAt(Date.now() + seconds * 1000);
  };

  const resend = useMutation<{ resend_available_in: number }, ApiError>({
    mutationFn: () => resendCode(challenge.id),
    onSuccess: ({ resend_available_in }) => {
      restart(resend_available_in);
      onResent?.();
      toast.success(`We sent a new code to ${challenge.email}.`);
    },
    onError: (error) => {
      const retryAfter = error.meta.retry_after_seconds;
      if (error.errorCode === AUTH_ERROR.otpResendCooldown && typeof retryAfter === 'number') restart(retryAfter);
      else if (error.errorCode === AUTH_ERROR.invalidCode) onExpired();
      toast.error(error.message);
    },
  });

  return (
    <p className="text-center text-sm text-muted">
      Didn&apos;t get it? Check your spam folder, or{' '}
      {left > 0 ? (
        <span aria-live="polite">resend in {left}s</span>
      ) : (
        <Button variant="tertiary" size="sm" className="h-auto px-1 text-primary" loading={resend.isPending} onClick={() => resend.mutate()}>
          resend the code
        </Button>
      )}
    </p>
  );
}
