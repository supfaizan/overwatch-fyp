// mirrors the backend schemas (app/workspaces)

export const ROLE = { owner: 'owner', admin: 'admin', member: 'member' } as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export type Workspace = {
  id: string;
  name: string;
  personal: boolean;
  role: Role;
};

export type WorkspaceMember = {
  user_id: string;
  username: string | null;
  github_login: string | null;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role: Role;
  joined_at: string;
};
