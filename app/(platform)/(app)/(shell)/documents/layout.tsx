import type { ReactNode } from 'react';
import DocsLayout from '@/features/docs';

const layout = ({ children }: { children: ReactNode }) => <DocsLayout>{children}</DocsLayout>;

export default layout;
