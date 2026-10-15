'use client';

import { toApiError } from '@/shared/api/envelope';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { startSession } from '@/shared/session/sign-in';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { verifyEmail } from '../api';
import { type Challenge, clearChallenge, readChallenge } from '../challenge';
import { AUTH_ERROR, CHALLENGE_PURPOSE, OTP_LENGTH, OTP_TTL_MINUTES } from '../constants';
import { takeDestination } from '../redirect';
import AuthCard from './auth-card';
import CodeInput from './code-input';
import ResendCode from './resend-code';

/** Enter the emailed code; a right one verifies the email and signs the user straight in. */
export default function VerifyEmail() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null | undefined>(undefined);
  const [code, setCode] = useState('');
  const [error, setError] = useState<{ message: string; locked: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return setChallenge(readChallenge(CHALLENGE_PURPOSE.verifyEmail));
  }, []);

  if (challenge === undefined) {
    return null;
  }
  if (challenge === null) {
    return <StartAgain />;
  }

  const submit = async (value: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await startSession((await verifyEmail(challenge.id, value)).access_token);
      clearChallenge();
      router.replace(takeDestination());
    } catch (failure) {
      const apiError = toApiError(failure);
      // the code stays in the boxes, so a typo can be fixed in place
      setError({
        message: apiError.fields.code ?? apiError.message,
        locked: apiError.errorCode === AUTH_ERROR.otpAttemptsExceeded,
      });
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Check your email"
      description={
        <>
          We sent a {OTP_LENGTH}-digit code to{' '}
          <span className="font-medium text-foreground">{challenge.email}</span>. It expires in{' '}
          {OTP_TTL_MINUTES} minutes.
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (code.length === OTP_LENGTH) {
            void submit(code);
          }
        }}
      >
        <CodeInput
          value={code}
          onChange={(value) => {
            setCode(value);
            if (!error?.locked) {
              setError(null);
            }
          }}
          onComplete={(value) => {
            return void submit(value);
          }}
          invalid={Boolean(error)}
          disabled={submitting || error?.locked}
        />
        {error && (
          <p id="code-error" role="alert" className="text-center text-xs text-danger">
            {error.message}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          disabled={code.length < OTP_LENGTH || error?.locked}
        >
          Verify email
        </Button>
      </form>
      <ResendCode
        challenge={challenge}
        onResent={() => {
          return setError(null);
        }}
        onExpired={() => {
          return setChallenge(null);
        }}
      />
      <p className="text-center text-sm text-muted">
        Wrong address?{' '}
        <Link
          href="/sign-up"
          onClick={clearChallenge}
          className="font-medium text-primary hover:underline"
        >
          Use a different email
        </Link>
      </p>
    </AuthCard>
  );
}

function StartAgain() {
  return (
    <AuthCard
      title="That code request expired"
      description="Sign in or sign up again and we'll send a new code."
    >
      <Banner type="info">
        Codes are tied to the browser tab that asked for them, and expire after a while.
      </Banner>
      <div className="flex gap-2">
        <Button asChild className="flex-1">
          <Link href="/sign-up">Sign up</Link>
        </Button>
        <Button asChild variant="primary" className="flex-1">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
