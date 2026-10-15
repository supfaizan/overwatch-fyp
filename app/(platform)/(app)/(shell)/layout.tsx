import AppShell from '@/features/shell';
import type { ReactNode } from 'react';

const layout = ({ children }: { children: ReactNode }) => <AppShell>{children}</AppShell>;

export default layout;
