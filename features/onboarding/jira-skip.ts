import { useWorkspace } from '@/shared/workspaces/store';

// remembered per tab and workspace: skipping Jira is a "not now", not a setting
const key = () => {
  return `ow_jira_skipped:${useWorkspace.getState().id}`;
};

export function isJiraSkipped(): boolean {
  try {
    return sessionStorage.getItem(key()) === '1';
  } catch {
    return false;
  }
}

export function skipJira(): void {
  try {
    sessionStorage.setItem(key(), '1');
  } catch {
    // storage blocked: the Jira step just shows again next time
  }
}
