'use client';

import { toApiError } from '@/shared/api/envelope';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import { Dialog, DialogContent } from '@/shared/components/dialog';
import GithubMark from '@/shared/components/github-mark';
import ConnectGithubButton, { useGithubLinkResult } from '@/shared/repos/connect-github-button';
import { publishUser } from '@/shared/session/refresh';
import { type User, useSession } from '@/shared/session/store';
import { zodResolver } from '@hookform/resolvers/zod';
import { EnvelopeSimple } from '@phosphor-icons/react/ssr';
import { type ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { getPendingMerge, type MergePreview, removeEmail, removeGithub } from '../api';
import { applyServerErrors } from '../form-errors';
import { loginMethods } from '../login-methods';
import { currentPasswordSchema, type CurrentPasswordValues } from '../schemas';
import AddEmailDialog from './add-email-dialog';
import FormField, { describedBy } from './form-field';
import MergeDialog from './merge-dialog';
import PasswordInput from './password-input';

// the GitHub round trip comes back with ?github=merge when the GitHub account had an Overwatch account of its own
const GITHUB_RESULT_PARAM = 'github';
const MERGE_RESULT = 'merge';
const REMOVE_FORM_ID = 'remove-login';

type Removal = { label: string; remove: (password: string) => Promise<User> };

/** The ways the signed-in user signs in: connect or add one, remove one while another remains, merge accounts. */
export default function LoginMethods() {
  const user = useSession((state) => {
    return state.user;
  });
  const [adding, setAdding] = useState(false);
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [merge, setMerge] = useState<MergePreview | null>(null);
  useGithubLinkResult();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(GITHUB_RESULT_PARAM) !== MERGE_RESULT) {
      return;
    }
    url.searchParams.delete(GITHUB_RESULT_PARAM);
    window.history.replaceState(null, '', url);
    getPendingMerge().then(setMerge, (error: unknown) => {
      return toast.error(toApiError(error).message);
    });
  }, []);

  if (!user) {
    return null;
  }
  const methods = loginMethods(user);

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">Sign-in methods</p>
        <p className="text-sm text-muted">
          Keep at least one. Having both means losing one never locks you out.
        </p>
      </div>
      <Row
        icon={<GithubMark />}
        name="GitHub"
        detail={methods.github.connected ? `@${user.github_login}` : 'Needed to add repositories'}
      >
        {methods.github.connected
          ? (
            <Button
              size="sm"
              disabled={!methods.github.removable}
              onClick={() => {
                setRemoval({ label: 'Disconnect GitHub', remove: removeGithub });
              }}
            >
              Disconnect
            </Button>
          )
          : <ConnectGithubButton returnTo="profile" />}
      </Row>
      <Row
        icon={<EnvelopeSimple />}
        name="Email and password"
        detail={methods.email.connected ? (user.email ?? '') : 'Not set up'}
      >
        {methods.email.connected
          ? (
            <Button
              size="sm"
              disabled={!methods.email.removable}
              onClick={() => {
                setRemoval({ label: 'Remove email sign-in', remove: removeEmail });
              }}
            >
              Remove
            </Button>
          )
          : (
            <Button
              size="sm"
              onClick={() => {
                setAdding(true);
              }}
            >
              Add email and password
            </Button>
          )}
      </Row>
      <AddEmailDialog open={adding} onOpenChange={setAdding} onMerge={setMerge} />
      <RemoveDialog
        removal={removal}
        onClose={() => {
          setRemoval(null);
        }}
      />
      <MergeDialog
        preview={merge}
        onClose={() => {
          setMerge(null);
        }}
      />
    </Card>
  );
}

function Row(
  { icon, name, detail, children }: {
    icon: ReactNode;
    name: string;
    detail: string;
    children: ReactNode;
  },
) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 [&_svg]:size-4 [&_svg]:text-muted">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted">{detail}</p>
      </div>
      {children}
    </div>
  );
}

/** Removing a sign-in method asks for the password, which also proves the method that remains works. */
function RemoveDialog({ removal, onClose }: { removal: Removal | null; onClose: () => void }) {
  const form = useForm<CurrentPasswordValues>({
    resolver: zodResolver(currentPasswordSchema),
    defaultValues: { password: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const close = () => {
    form.reset();
    onClose();
  };

  const submit = form.handleSubmit(async ({ password }) => {
    if (!removal) {
      return;
    }
    try {
      publishUser(await removal.remove(password));
      toast.success('Sign-in method removed.');
      close();
    } catch (failure) {
      applyServerErrors(failure, form.setError, ['password']);
    }
  });

  return (
    <Dialog
      open={Boolean(removal)}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      {removal && (
        <DialogContent
          title={removal.label}
          description="Enter your password to confirm."
          footer={
            <Button type="submit" form={REMOVE_FORM_ID} variant="danger" loading={isSubmitting}>
              {removal.label}
            </Button>
          }
        >
          <form id={REMOVE_FORM_ID} noValidate onSubmit={submit}>
            <FormField
              id="current-password"
              label="Password"
              error={errors.password?.message ?? errors.root?.message}
            >
              <PasswordInput
                autoComplete="current-password"
                autoFocus
                {...describedBy(
                  'current-password',
                  errors.password?.message ?? errors.root?.message,
                )}
                {...form.register('password')}
              />
            </FormField>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
