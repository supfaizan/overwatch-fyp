'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import FormField, { describedBy } from '@/shared/components/form-field';
import { Input } from '@/shared/components/input';
import RadioGroup from '@/shared/components/radio-group';
import { applyServerErrors } from '@/shared/lib/form-errors';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, HandWaving } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { joinWaitlist, type WaitlistJoined } from '../api';
import { HEARD_FROM_OPTIONS } from '../constants';
import { waitlistSchema, type WaitlistValues } from '../schemas';

const FIELDS = ['name', 'email', 'heard_from'] as const;

export default function WaitlistForm() {
  const [joined, setJoined] = useState<WaitlistJoined | null>(null);
  const form = useForm<WaitlistValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { name: '', email: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      setJoined(await joinWaitlist(values));
    } catch (failure) {
      applyServerErrors(failure, form.setError, FIELDS);
    }
  });

  return (
    <div aria-live="polite">
      {joined
        ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            {joined.already_joined
              ? (
                <>
                  <HandWaving className="size-8 text-primary" weight="fill" />
                  <p className="font-semibold">You&apos;re already on the list!</p>
                  <p className="max-w-xs text-sm text-muted">
                    Good to see you again. Your spot is saved, and we&apos;ll email you as soon as
                    the private beta has room for you.
                  </p>
                </>
              )
              : (
                <>
                  <CheckCircle className="size-8 text-success" weight="fill" />
                  <p className="font-semibold">You&apos;re on the list.</p>
                  <p className="text-sm text-muted">Check your inbox, we just sent you a note.</p>
                </>
              )}
          </div>
        )
        : (
          <form noValidate onSubmit={submit} className="flex flex-col gap-4">
            {errors.root?.message && <Banner type="error">{errors.root.message}</Banner>}
            <FormField id="waitlist-name" label="Name" error={errors.name?.message}>
              <Input
                size="lg"
                autoComplete="name"
                {...describedBy('waitlist-name', errors.name?.message)}
                {...form.register('name')}
              />
            </FormField>
            <FormField id="waitlist-email" label="Email" error={errors.email?.message}>
              <Input
                size="lg"
                type="email"
                autoComplete="email"
                {...describedBy('waitlist-email', errors.email?.message)}
                {...form.register('email')}
              />
            </FormField>
            <FormField
              id="waitlist-heard-from"
              label="How did you hear about us?"
              error={errors.heard_from?.message}
              group
            >
              <Controller
                control={form.control}
                name="heard_from"
                render={({ field }) => {
                  return (
                    <RadioGroup
                      options={HEARD_FROM_OPTIONS}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      {...describedBy('waitlist-heard-from', errors.heard_from?.message)}
                    />
                  );
                }}
              />
            </FormField>
            <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
              Join waitlist
            </Button>
          </form>
        )}
    </div>
  );
}
