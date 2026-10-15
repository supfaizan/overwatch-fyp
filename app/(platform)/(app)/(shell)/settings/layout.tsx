import { SettingsLayout } from '@/features/settings';
import type { ReactNode } from 'react';

const layout = ({ children }: { children: ReactNode }) => {
  return <SettingsLayout>{children}</SettingsLayout>;
};

export default layout;
