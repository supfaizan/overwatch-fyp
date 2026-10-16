'use client';

import { queryKeys } from '@/shared/api/query-keys';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import FormField, { describedBy } from '@/shared/components/form-field';
import { Input } from '@/shared/components/input';
import { applyServerErrors } from '@/shared/lib/form-errors';
import { startSession } from '@/shared/session/sign-in';
import { saveLastWorkspace } from '@/shared/workspaces/lib';
import { useWorkspace } from '@/shared/workspaces/store';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { signUpWithInvite } from '../api';
import { inviteSignUpSchema, type InviteSignUpValues } from '../schemas';
import AuthShell from './auth-shell';
import { NewPasswordField } from './password-input';
import UsernameField, { useUsernameAvailability } from './username-input';

/**
 * Create an account from an email invite and land in its workspace. The address is the invite's and
 * can't be changed; the link already proved it, so there's no code to enter.
 */
export default function InviteSignUp(
  { token, email, title, description }: {
    token: string;
    email: string;
    title: string;
    description: ReactNode;
  },
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<InviteSignUpValues>({
    resolver: zodResolver(inviteSignUpSchema),
    defaultValues: { name: '', username: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const username = useWatch({ control: form.control, name: 'username' });
  const availability = useUsernameAvailability(username);

  const submit = form.handleSubmit(async (values) => {
    if (availability.problem) {
      return form.setError('username', { message: availability.problem }, { shouldFocus: true });
    }
    try {
      const { access_token, workspace } = await signUpWithInvite({ ...values, token });
      const user = await startSession(access_token);
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      useWorkspace.getState().setId(workspace.id);
      saveLastWorkspace(user.id, workspace.id);
      router.replace('/dashboard');
    } catch (failure) {
      applyServerErrors(failure, form.setError, ['name', 'username', 'password']);
    }
  });

  return (
    <AuthShell title={title} description={description}>
      {errors.root?.message && <Banner type="error">{errors.root.message}</Banner>}
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <FormField
          id="email"
          label="Email"
          hint="Invites are tied to the address they were sent to."
        >
          <Input
            size="lg"
            type="email"
            value={email}
            readOnly
            aria-readonly
            autoComplete="email"
            id="email"
            aria-describedby="email-hint"
          />
        </FormField>
        <FormField id="name" label="Name" error={errors.name?.message}>
          <Input
            size="lg"
            autoComplete="name"
            autoFocus
            {...describedBy('name', errors.name?.message)}
            {...form.register('name')}
          />
        </FormField>
        <UsernameField
          value={username}
          availability={availability}
          error={errors.username?.message}
          registration={form.register('username')}
        />
        <NewPasswordField
          error={errors.password?.message}
          registration={form.register('password')}
        />
        <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
          Create account and join
        </Button>
      </form>
    </AuthShell>
  );
}
