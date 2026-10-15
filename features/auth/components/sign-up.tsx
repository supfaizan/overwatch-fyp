'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { useSession } from '@/shared/session/store';
import { signUp } from '../api';
import { saveChallenge } from '../challenge';
import { CHALLENGE_PURPOSE } from '../constants';
import { applyServerErrors } from '../form-errors';
import { rememberDestination, safeDestination } from '../redirect';
import { signUpSchema, type SignUpValues } from '../schemas';
import AuthCard from './auth-card';
import FormField, { describedBy } from './form-field';
import GithubSignIn from './github-sign-in';
import { NewPasswordField } from './password-input';
import UsernameField, { useUsernameAvailability } from './username-input';

export default function SignUp({ from }: { from?: string }) {
  const status = useSession((state) => state.status);
  const router = useRouter();
  const form = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema), defaultValues: { name: '', username: '', email: '', password: '' } });
  const { errors, isSubmitting } = form.formState;
  const username = useWatch({ control: form.control, name: 'username' });
  const availability = useUsernameAvailability(username);

  useEffect(() => {
    if (status === 'authenticated') router.replace(safeDestination(from));
  }, [status, from, router]);

  const submit = form.handleSubmit(async (values) => {
    if (availability.problem) return form.setError('username', { message: availability.problem }, { shouldFocus: true });
    try {
      saveChallenge(await signUp(values), CHALLENGE_PURPOSE.verifyEmail);
      rememberDestination(from);
      router.push('/verify-email');
    } catch (failure) {
      applyServerErrors(failure, form.setError, ['name', 'username', 'email', 'password']);
    }
  });

  return (
    <AuthCard title="Create your account" description="Map your codebase and your team's work in one place.">
      {errors.root?.message && <Banner type="error">{errors.root.message}</Banner>}
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <FormField id="name" label="Name" error={errors.name?.message}>
          <Input size="lg" autoComplete="name" {...describedBy('name', errors.name?.message)} {...form.register('name')} />
        </FormField>
        <UsernameField value={username} availability={availability} error={errors.username?.message} registration={form.register('username')} />
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input size="lg" type="email" autoComplete="email" {...describedBy('email', errors.email?.message)} {...form.register('email')} />
        </FormField>
        <NewPasswordField error={errors.password?.message} registration={form.register('password')} />
        <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
          Create account
        </Button>
      </form>
      <GithubSignIn from={from} label="Sign up with GitHub" />
      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
