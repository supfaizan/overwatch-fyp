import { SettingsLayout } from '@/features/settings';
import type { ReactNode } from 'react';

const layout = ({ children }: { children: ReactNode }) => (
  <SettingsLayout>{children}</SettingsLayout>
);

export default layout;
