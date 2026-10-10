import type { ReactNode } from 'react';
import { SettingsLayout } from '@/features/settings';

const layout = ({ children }: { children: ReactNode }) => <SettingsLayout>{children}</SettingsLayout>;

export default layout;
