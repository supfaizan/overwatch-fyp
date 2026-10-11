import type { ReactNode } from 'react';
import SessionGate from '@/shared/session/session-gate';
import WorkspaceGate from '@/shared/workspaces/workspace-gate';

const layout = ({ children }: { children: ReactNode }) => (
  <SessionGate>
    <WorkspaceGate>{children}</WorkspaceGate>
  </SessionGate>
);

export default layout;
