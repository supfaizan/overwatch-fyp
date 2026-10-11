// mirrors the backend schemas (app/workspaces)

export type Role = 'owner' | 'admin' | 'member';

export type Workspace = {
  id: string;
  name: string;
  personal: boolean;
  role: Role;
};
