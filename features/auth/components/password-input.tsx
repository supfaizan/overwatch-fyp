'use client';

import { Eye, EyeSlash } from '@phosphor-icons/react/ssr';
import { useState, type ComponentProps } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import Button from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { PASSWORD_HINT } from '../constants';
import FormField, { describedBy } from './form-field';

/** A password input with a show/hide toggle; every other prop goes to the `<input>`. */
export default function PasswordInput(props: Omit<ComponentProps<typeof Input>, 'type' | 'suffix'>) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      size="lg"
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      spellCheck={false}
      {...props}
      suffix={
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          iconOnly
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((shown) => !shown)}
        >
          {visible ? <EyeSlash /> : <Eye />}
        </Button>
      }
    />
  );
}

/** A field for choosing a new password, with the length hint. */
export function NewPasswordField({
  id = 'password',
  label = 'Password',
  hint = PASSWORD_HINT,
  error,
  registration,
}: {
  id?: string;
  label?: string;
  /** Pass `null` for a field that needs none, like "confirm". */
  hint?: string | null;
  error?: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <PasswordInput autoComplete="new-password" {...describedBy(id, error, Boolean(hint))} {...registration} />
    </FormField>
  );
}
