import FormField, { describedBy } from '@/shared/components/form-field';
import { Input } from '@/shared/components/input';

export function WithHint() {
  return (
    <FormField id="example-name" label="Name" hint="As it appears to your team.">
      <Input {...describedBy('example-name', undefined, true)} />
    </FormField>
  );
}

export function WithError() {
  return (
    <FormField id="example-email" label="Email" error="Enter a valid email">
      <Input
        type="email"
        defaultValue="ada@"
        {...describedBy('example-email', 'Enter a valid email')}
      />
    </FormField>
  );
}
