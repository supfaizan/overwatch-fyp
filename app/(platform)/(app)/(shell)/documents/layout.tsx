import DocsLayout from '@/features/docs';
import type { ReactNode } from 'react';

const layout = ({ children }: { children: ReactNode }) => {
  return <DocsLayout>{children}</DocsLayout>;
};

export default layout;
