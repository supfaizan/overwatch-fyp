import type { ReactNode } from 'react';
import SessionGate from '@/shared/session/session-gate';

const layout = ({ children }: { children: ReactNode }) => <SessionGate>{children}</SessionGate>;

export default layout;
