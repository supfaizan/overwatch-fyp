'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { applyServerErrors } from '@/shared/lib/form-errors';
import { publishUser } from '@/shared/session/refresh';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { setUsername } from '../api';
import { AUTH_ERROR } from '../constants';
import { safeDestination } from '../redirect';
import { usernameSchema, type UsernameValues } from '../schemas';
import AuthShell from './auth-shell';
import UsernameField, { useUsernameAvailability } from './username-input';

/** Asked once of accounts without a username (from before usernames, or whose GitHub login was taken). */
export default function ChooseUsername({ from }: { from?: string }) {
  const router = useRouter();
  const form = useForm<UsernameValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const username = useWatch({ control: form.control, name: 'username' });
  const availability = useUsernameAvailability(username);

  const submit = form.handleSubmit(async (values) => {
    if (availability.problem) {
      return form.setError('username', { message: availability.problem }, { shouldFocus: true });
    }
    try {
      publishUser(await setUsername(values.username));
      router.replace(safeDestination(from));
    } catch (failure) {
      const apiError = applyServerErrors(failure, form.setError, ['username']);
      if (apiError.errorCode === AUTH_ERROR.usernameAlreadySet) {
        router.replace(safeDestination(from));
      }
    }
  });

  return (
    <AuthShell
      title="Choose a username"
      description="It's how teammates mention and find you. You can't change it later."
    >
      {errors.root?.message && <Banner type="error">{errors.root.message}</Banner>}
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <UsernameField
          value={username}
          availability={availability}
          error={errors.username?.message}
          registration={form.register('username')}
          autoFocus
        />
        <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
          Continue
        </Button>
      </form>
    </AuthShell>
  );
}
