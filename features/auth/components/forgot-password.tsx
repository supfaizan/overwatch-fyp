'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import FormField, { describedBy } from '@/shared/components/form-field';
import { Input } from '@/shared/components/input';
import { applyServerErrors } from '@/shared/lib/form-errors';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { requestPasswordReset } from '../api';
import { saveChallenge } from '../challenge';
import { CHALLENGE_PURPOSE } from '../constants';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas';
import AuthCard from './auth-card';

export default function ForgotPassword() {
  const router = useRouter();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      // the same answer whether or not the email has an account
      saveChallenge(await requestPasswordReset(values), CHALLENGE_PURPOSE.resetPassword);
      router.push('/reset-password');
    } catch (failure) {
      applyServerErrors(failure, form.setError, ['email']);
    }
  });

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your account's email. If it has an account, we'll send a code to reset the password."
    >
      {errors.root?.message && <Banner type="error">{errors.root.message}</Banner>}
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input
            size="lg"
            type="email"
            autoComplete="email"
            autoFocus
            {...describedBy('email', errors.email?.message)}
            {...form.register('email')}
          />
        </FormField>
        <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
          Send code
        </Button>
      </form>
      <p className="text-center text-sm text-muted">
        Remembered it?{' '}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
