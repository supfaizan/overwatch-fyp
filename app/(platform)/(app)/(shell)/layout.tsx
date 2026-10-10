import type { ReactNode } from 'react';
import AppShell from '@/features/shell';

const layout = ({ children }: { children: ReactNode }) => <AppShell>{children}</AppShell>;

export default layout;
