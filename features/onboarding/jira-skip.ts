// remembered per tab: skipping Jira is a "not now", not a setting
const KEY = 'ow_jira_skipped';

export function isJiraSkipped(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function skipJira(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // storage blocked: the Jira step just shows again next time
  }
}
