'use client';

import { toApiError } from '@/shared/api/envelope';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { Dialog, DialogContent } from '@/shared/components/dialog';
import { Input } from '@/shared/components/input';
import { publishUser } from '@/shared/session/refresh';
import type { User } from '@/shared/session/store';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { addEmail, type MergePreview, verifyAddedEmail } from '../api';
import { type Challenge, challengeFrom } from '../challenge';
import { CHALLENGE_PURPOSE, OTP_LENGTH, OTP_TTL_MINUTES } from '../constants';
import { applyServerErrors } from '../form-errors';
import { addEmailSchema, type AddEmailValues } from '../schemas';
import CodeInput from './code-input';
import FormField, { describedBy } from './form-field';
import { NewPasswordField } from './password-input';
import ResendCode from './resend-code';

const FORM_ID = 'add-email';

type AddEmailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** An address that can't be changed, e.g. the one an invite was sent to. */
  email?: string;
  onAdded?: (user: User) => void;
  /** The address belongs to another account, which can now be merged in. */
  onMerge: (preview: MergePreview) => void;
};

/**
 * Add an email and password to the signed-in account: the address gets a code, and the right code adds it,
 * or offers to merge in the account that already uses it.
 */
export default function AddEmailDialog(
  { open, onOpenChange, email, onAdded, onMerge }: AddEmailDialogProps,
) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const close = (next: boolean) => {
    if (!next) {
      setChallenge(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      {challenge
        ? (
          <CodeStep
            challenge={challenge}
            onRestart={() => {
              setChallenge(null);
            }}
            onDone={(result) => {
              close(false);
              if (result.outcome === 'added') {
                publishUser(result.me);
                toast.success(`You can now sign in with ${result.me.email}.`);
                onAdded?.(result.me);
              } else {
                onMerge(result.merge);
              }
            }}
          />
        )
        : <DetailsStep email={email} onSent={setChallenge} />}
    </Dialog>
  );
}

function DetailsStep(
  { email, onSent }: { email?: string; onSent: (challenge: Challenge) => void },
) {
  const form = useForm<AddEmailValues>({
    resolver: zodResolver(addEmailSchema),
    defaultValues: { email: email ?? '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      onSent(
        challengeFrom(await addEmail(values.email, values.password), CHALLENGE_PURPOSE.addEmail),
      );
    } catch (failure) {
      applyServerErrors(failure, form.setError, ['email', 'password']);
    }
  });

  return (
    <DialogContent
      title="Add email and password"
      description="Sign in with either GitHub or your email. We'll send a code to confirm the address."
      footer={
        <Button type="submit" form={FORM_ID} variant="primary" loading={isSubmitting}>
          Send code
        </Button>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className="flex flex-col gap-4">
        {errors.root?.message && <Banner type="error">{errors.root.message}</Banner>}
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input
            size="lg"
            type="email"
            autoComplete="email"
            readOnly={Boolean(email)}
            autoFocus={!email}
            {...describedBy('email', errors.email?.message)}
            {...form.register('email')}
          />
        </FormField>
        <NewPasswordField
          error={errors.password?.message}
          registration={form.register('password')}
        />
      </form>
    </DialogContent>
  );
}

function CodeStep(
  { challenge, onRestart, onDone }: {
    challenge: Challenge;
    onRestart: () => void;
    onDone: (result: Awaited<ReturnType<typeof verifyAddedEmail>>) => void;
  },
) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (value: string) => {
    setSubmitting(true);
    setError(null);
    try {
      onDone(await verifyAddedEmail(challenge.id, value));
    } catch (failure) {
      const apiError = toApiError(failure);
      // the code stays in the boxes, so a typo can be fixed in place
      setError(apiError.fields.code ?? apiError.message);
      setSubmitting(false);
    }
  };

  return (
    <DialogContent
      title="Check your email"
      description={
        <>
          We sent a {OTP_LENGTH}-digit code to{' '}
          <span className="font-medium text-foreground">{challenge.email}</span>. It expires in{' '}
          {OTP_TTL_MINUTES} minutes.
        </>
      }
      footer={
        <Button
          variant="primary"
          loading={submitting}
          disabled={code.length < OTP_LENGTH}
          onClick={() => {
            void submit(code);
          }}
        >
          Confirm email
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <CodeInput
          value={code}
          onChange={(value) => {
            setCode(value);
            setError(null);
          }}
          onComplete={(value) => {
            void submit(value);
          }}
          invalid={Boolean(error)}
          disabled={submitting}
        />
        {error && (
          <p id="code-error" role="alert" className="text-center text-xs text-danger">
            {error}
          </p>
        )}
        <ResendCode challenge={challenge} onExpired={onRestart} />
      </div>
    </DialogContent>
  );
}
