'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { startSession } from '@/shared/session/sign-in';
import { useSession } from '@/shared/session/store';
import { signIn, type ChallengeIssued } from '../api';
import { saveChallenge } from '../challenge';
import { AUTH_ERROR, CHALLENGE_PURPOSE } from '../constants';
import { signInErrorMessage } from '../errors';
import { applyServerErrors } from '../form-errors';
import { rememberDestination, safeDestination } from '../redirect';
import { signInSchema, type SignInValues } from '../schemas';
import AuthCard from './auth-card';
import FormField, { describedBy } from './form-field';
import GithubSignIn from './github-sign-in';
import PasswordInput from './password-input';

type SignInProps = {
  error?: string;
  from?: string;
  reset?: boolean;
  /** Fixed, e.g. the address an invite was sent to. */
  email?: string;
  title?: string;
  description?: ReactNode;
};

export default function SignIn({ error, from, reset, email, title = 'Sign in', description = 'Welcome back. Sign in with your email or GitHub.' }: SignInProps) {
  const status = useSession((state) => state.status);
  const router = useRouter();
  const message = signInErrorMessage(error);
  const form = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { email: email ?? '', password: '' } });
  const { errors, isSubmitting } = form.formState;

  // already signed in (e.g. a bookmarked /sign-in): skip straight ahead
  useEffect(() => {
    if (status === 'authenticated' && !isSubmitting) router.replace(safeDestination(from));
  }, [status, from, router, isSubmitting]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await startSession((await signIn(values)).access_token);
      router.replace(safeDestination(from));
    } catch (failure) {
      const apiError = applyServerErrors(failure, form.setError, ['email', 'password']);
      if (apiError.errorCode === AUTH_ERROR.emailNotVerified) {
        // the right password on an unverified account: a fresh code is on its way
        saveChallenge(apiError.meta as ChallengeIssued, CHALLENGE_PURPOSE.verifyEmail);
        rememberDestination(from);
        router.push('/verify-email');
      }
    }
  });

  return (
    <AuthCard title={title} description={description}>
      {message && <Banner type="error">{message}</Banner>}
      {reset && <Banner type="success">Your password was changed. Sign in with the new one.</Banner>}
      {errors.root?.message && <Banner type="error">{errors.root.message}</Banner>}
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input
            size="lg"
            type="email"
            autoComplete="email"
            readOnly={Boolean(email)}
            {...describedBy('email', errors.email?.message)}
            {...form.register('email')}
          />
        </FormField>
        <FormField
          id="password"
          label="Password"
          error={errors.password?.message}
          action={
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput autoComplete="current-password" {...describedBy('password', errors.password?.message)} {...form.register('password')} />
        </FormField>
        <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <GithubSignIn from={from} label="Continue with GitHub" />
      <p className="text-center text-sm text-muted">
        New to Overwatch?{' '}
        <Link href={from ? `/sign-up?from=${encodeURIComponent(safeDestination(from))}` : '/sign-up'} className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
