/** Anyone shown in the UI: the signed-in user, a workspace member, an assignee. */
type Person = {
  name: string | null;
  username: string | null;
  github_login?: string | null;
  email?: string | null;
};

export function displayName(person: Person): string {
  return person.name || person.username || person.github_login || person.email || 'Unknown';
}

/** `@username`; accounts from before usernames fall back to their GitHub login or email. */
export function handle(person: Person): string {
  if (person.username) {
    return `@${person.username}`;
  }
  if (person.github_login) {
    return `@${person.github_login}`;
  }
  return person.email ?? '';
}
