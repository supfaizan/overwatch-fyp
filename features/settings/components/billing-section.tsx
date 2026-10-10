import Card from '@/shared/components/card';
import { SettingsSection } from './settings-layout';

// placeholder until billing exists
export default function BillingSection() {
  return (
    <SettingsSection title="Billing" description="Your plan and invoices.">
      <Card className="text-sm text-muted">Overwatch is free while in early access. Plans and billing arrive later.</Card>
    </SettingsSection>
  );
}
