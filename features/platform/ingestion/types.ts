export type JobStatus = "pending" | "in_progress" | "done" | "failed";
export type WebhookStatus = "pending" | "created" | "failed";

export interface GithubRepository {
  fullName: string;
  private: boolean;
  defaultBranch?: string;
  admin: boolean;
  updatedAt?: string;
}

export interface ConnectedRepository {
  repoFullName: string;
  defaultBranch: string;
  webhookStatus: WebhookStatus;
  webhookError?: string;
  parseStatus: JobStatus;
}

export interface JiraProject {
  id?: string;
  key: string;
  name?: string;
}

export interface ConnectedJiraProject {
  projectKey: string;
  cloudId: string;
  syncStatus: JobStatus;
}

export interface OnboardingStatus {
  github: {
    connected: boolean;
    needsReauth: boolean;
    repoConnected: boolean;
    repoFullName: string | null;
    parseStatus: JobStatus | null;
    webhookStatus: WebhookStatus | null;
    webhookError: string | null;
  };
  jira: {
    connected: boolean;
    needsReauth: boolean;
    projectConnected: boolean;
    syncStatus: JobStatus | null;
  };
}

export interface Repository {
  id: string;
  fullName: string;
  state: "indexing" | "ready" | "failed";
}
