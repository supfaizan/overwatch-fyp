import type { ReactNode } from 'react';
import SessionProvider from '@/shared/session/session-provider';

// one provider for sign-in and the app, so moving between them keeps the session and query cache
const layout = ({ children }: { children: ReactNode }) => <SessionProvider>{children}</SessionProvider>;

export default layout;
