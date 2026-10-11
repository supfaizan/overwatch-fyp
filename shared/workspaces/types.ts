// mirrors the backend schemas (app/workspaces)

export const ROLE = { owner: 'owner', admin: 'admin', member: 'member' } as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export type Workspace = {
  id: string;
  name: string;
  personal: boolean;
  role: Role;
};
