import type { User } from '@/shared/session/store';

type Method = { connected: boolean; removable: boolean };

/**
 * What a user can do with each way they sign in: a method can only go while another remains, and removing
 * GitHub needs the password the email login uses.
 */
export function loginMethods(user: User): { github: Method; email: Method } {
  const github = Boolean(user.github_login);
  const email = user.email_verified && user.has_password;
  return {
    github: { connected: github, removable: github && email },
    email: { connected: user.email_verified, removable: user.email_verified && github },
  };
}
