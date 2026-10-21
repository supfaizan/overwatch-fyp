import QueryProvider from '@/shared/api/query-provider';
import SessionProvider from '@/shared/session/session-provider';
import type { ReactNode } from 'react';

// shared by sign-in and the app, so moving between them keeps the session and query cache
const layout = ({ children }: { children: ReactNode }) => {
  return (
    <QueryProvider>
      <SessionProvider>{children}</SessionProvider>
    </QueryProvider>
  );
};

export default layout;
