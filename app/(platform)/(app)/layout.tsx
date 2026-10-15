import SessionGate from '@/shared/session/session-gate';
import WorkspaceGate from '@/shared/workspaces/workspace-gate';
import type { ReactNode } from 'react';

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <SessionGate>
      <WorkspaceGate>{children}</WorkspaceGate>
    </SessionGate>
  );
};

export default layout;
