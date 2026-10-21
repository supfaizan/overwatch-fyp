'use client';

import FormField, { describedBy } from '@/shared/components/form-field';
import { Input } from '@/shared/components/input';
import Spinner from '@/shared/components/spinner';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react/ssr';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { checkUsername } from '../api';
import { USERNAME_MAX_LENGTH, USERNAME_MESSAGES } from '../constants';
import { username as usernameRule } from '../schemas';

const CHECK_AFTER_MS = 300;
const keys = {
  availability: (username: string) => {
    return ['auth', 'username-availability', username] as const;
  },
};

export type UsernameAvailability = ReturnType<typeof useUsernameAvailability>;

/**
 * Whether a username can be had, checked as the user types: after a short pause, only once it fits
 * the rules, cancelling a check that's no longer wanted. Saving is the real check.
 */
export function useUsernameAvailability(value: string) {
  const candidate = value.trim().toLowerCase();
  const [settled, setSettled] = useState(candidate);
  useEffect(() => {
    const timer = setTimeout(() => {
      return setSettled(candidate);
    }, CHECK_AFTER_MS);
    return () => {
      return clearTimeout(timer);
    };
  }, [candidate]);

  const fits = usernameRule.safeParse(settled).success;
  const query = useQuery({
    queryKey: keys.availability(settled),
    queryFn: ({ signal }) => {
      return checkUsername(settled, signal);
    },
    enabled: fits,
    staleTime: 30_000,
    retry: false,
  });
  const pending = candidate !== settled || (fits && query.isFetching);
  const problem = !pending && query.data && !query.data.available && query.data.reason
    ? USERNAME_MESSAGES[query.data.reason]
    : undefined;
  return {
    pending,
    problem,
    available: !pending && query.data?.available === true && query.data.username === candidate,
  };
}

/** The username field: shows whether it's free, and lowercases as the user types, the way usernames are stored. */
export default function UsernameField({
  value,
  availability,
  error,
  registration,
  autoFocus,
}: {
  value: string;
  availability: UsernameAvailability;
  /** The form's own error, shown before the availability problem. */
  error?: string;
  registration: UseFormRegisterReturn<'username'>;
  autoFocus?: boolean;
}) {
  const { pending, available, problem } = availability;
  const shown = error ?? problem;
  return (
    <FormField id="username" label="Username" error={shown}>
      <Input
        size="lg"
        autoCapitalize="none"
        autoComplete="username"
        spellCheck={false}
        autoFocus={autoFocus}
        // room for pasted spaces and capitals; the backend caps the check the same way
        maxLength={USERNAME_MAX_LENGTH * 2}
        prefix={<span className="text-sm text-muted">@</span>}
        value={value}
        {...describedBy('username', shown)}
        {...registration}
        onChange={(event) => {
          event.target.value = event.target.value.toLowerCase();
          return registration.onChange(event);
        }}
        suffix={value && (
          <span aria-live="polite" className="flex items-center">
            {pending
              ? <Spinner className="size-4 text-muted" />
              : available
              ? <CheckCircle weight="fill" className="text-success!" aria-label="Available" />
              : problem
              ? <WarningCircle weight="fill" className="text-danger!" aria-label={problem} />
              : null}
          </span>
        )}
      />
    </FormField>
  );
}
