'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { resetPassword } from '../api';
import { clearChallenge, readChallenge, type Challenge } from '../challenge';
import { CHALLENGE_PURPOSE, OTP_LENGTH } from '../constants';
import { applyServerErrors } from '../form-errors';
import { codeSchema, resetPasswordSchema, type ResetPasswordValues } from '../schemas';
import AuthCard from './auth-card';
import CodeInput from './code-input';
import { NewPasswordField } from './password-input';
import ResendCode from './resend-code';

/** The emailed code and a new password; afterwards every session is signed out and the user signs in again. */
export default function ResetPassword() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null | undefined>(undefined);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();
  const form = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: '', confirm: '' } });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => setChallenge(readChallenge(CHALLENGE_PURPOSE.resetPassword)), []);

  if (challenge === undefined) return null;
  if (challenge === null) {
    return (
      <AuthCard title="That reset request expired" description="Ask for a new code to reset your password.">
        <Button asChild variant="primary" size="lg">
          <Link href="/forgot-password">Send a new code</Link>
        </Button>
      </AuthCard>
    );
  }

  const submit = form.handleSubmit(async ({ password }) => {
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) return setCodeError(parsed.error.issues[0]?.message);
    setCodeError(undefined);
    try {
      await resetPassword(challenge.id, code, password);
      clearChallenge();
      router.replace('/sign-in?reset=1');
    } catch (failure) {
      const apiError = applyServerErrors(failure, form.setError, ['password']);
      if (apiError.fields.code || !Object.keys(apiError.fields).length) {
        // the code stays in the boxes, so a typo can be fixed in place
        form.clearErrors('root');
        setCodeError(apiError.fields.code ?? apiError.message);
      }
    }
  });

  return (
    <AuthCard
      title="Choose a new password"
      description={
        <>
          If <span className="font-medium text-foreground">{challenge.email}</span> has an account, we sent it a {OTP_LENGTH}-digit code.
        </>
      }
    >
      {errors.root?.message && <Banner type="error">{errors.root.message}</Banner>}
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Code</span>
          <CodeInput
            value={code}
            onChange={(value) => {
              setCode(value);
              setCodeError(undefined);
            }}
            onComplete={() => form.setFocus('password')} invalid={Boolean(codeError)} disabled={isSubmitting} />
          {codeError && (
            <p id="code-error" role="alert" className="text-xs text-danger">
              {codeError}
            </p>
          )}
        </div>
        <NewPasswordField label="New password" error={errors.password?.message} registration={form.register('password')} />
        <NewPasswordField id="confirm" label="Confirm new password" hint={null} error={errors.confirm?.message} registration={form.register('confirm')} />
        <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
          Reset password
        </Button>
      </form>
      <ResendCode challenge={challenge} onExpired={() => setChallenge(null)} />
    </AuthCard>
  );
}
