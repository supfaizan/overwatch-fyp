import { api } from "@/lib/axios";
import { SERVICES } from "@/lib/services";
import type {
  ConnectedJiraProject,
  ConnectedRepository,
  GithubRepository,
  JiraProject,
  OnboardingStatus,
} from "../types";

interface GithubReposResponse {
  repos: Array<{
    full_name: string;
    private: boolean;
    default_branch?: string;
    admin: boolean;
    updated_at?: string;
  }>;
}

interface ConnectRepoResponse {
  repo_full_name: string;
  default_branch: string;
  webhook_status: ConnectedRepository["webhookStatus"];
  webhook_error?: string;
  parse_status: ConnectedRepository["parseStatus"];
}

interface JiraProjectsResponse {
  projects: Array<{ id?: string; key: string; name?: string }>;
}

interface ConnectProjectResponse {
  project_key: string;
  cloud_id: string;
  sync_status: ConnectedJiraProject["syncStatus"];
}

interface OnboardingStatusResponse {
  github: {
    connected: boolean;
    needs_reauth: boolean;
    repo_connected: boolean;
    repo_full_name: string | null;
    parse_status: OnboardingStatus["github"]["parseStatus"];
    webhook_status: OnboardingStatus["github"]["webhookStatus"];
    webhook_error: string | null;
  };
  jira: {
    connected: boolean;
    needs_reauth: boolean;
    project_connected: boolean;
    sync_status: OnboardingStatus["jira"]["syncStatus"];
  };
}

export async function getGithubRepos(): Promise<GithubRepository[]> {
  const { data } = await api.get<GithubReposResponse>("/github/repos");
  return data.repos.map((repo) => ({
    fullName: repo.full_name,
    private: repo.private,
    defaultBranch: repo.default_branch,
    admin: repo.admin,
    updatedAt: repo.updated_at,
  }));
}

export async function connectRepo(
  repoFullName: string,
): Promise<ConnectedRepository> {
  const { data } = await api.post<ConnectRepoResponse>("/github/repos/connect", {
    repo_full_name: repoFullName,
  });
  return {
    repoFullName: data.repo_full_name,
    defaultBranch: data.default_branch,
    webhookStatus: data.webhook_status,
    webhookError: data.webhook_error,
    parseStatus: data.parse_status,
  };
}

interface ConnectedReposResponse {
  repos: Array<{
    repo_full_name: string;
    default_branch: string;
    webhook_status: ConnectedRepository["webhookStatus"];
    webhook_error?: string;
    parse_status: ConnectedRepository["parseStatus"];
    parse_error?: string;
  }>;
}

export async function getConnectedRepos(): Promise<ConnectedRepository[]> {
  const { data } = await api.get<ConnectedReposResponse>(
    "/github/repos/connected",
  );
  return data.repos.map((repo) => ({
    repoFullName: repo.repo_full_name,
    defaultBranch: repo.default_branch,
    webhookStatus: repo.webhook_status,
    webhookError: repo.webhook_error,
    parseStatus: repo.parse_status,
  }));
}

export async function retryGithubWebhook(repoFullName: string): Promise<void> {
  await api.post("/github/repos/webhook/retry", { repo_full_name: repoFullName });
}

export async function startJiraOAuth(): Promise<string> {
  const { data } = await api.post<{ authorization_url: string }>("/jira/login");
  return data.authorization_url;
}

export async function disconnectJira(): Promise<void> {
  await api.delete("/jira/connection");
}

export async function getJiraProjects(): Promise<JiraProject[]> {
  const { data } = await api.get<JiraProjectsResponse>("/jira/projects");
  return data.projects;
}

export async function connectJiraProject(
  projectKey: string,
): Promise<ConnectedJiraProject> {
  const { data } = await api.post<ConnectProjectResponse>(
    "/jira/projects/connect",
    { project_key: projectKey },
  );
  return {
    projectKey: data.project_key,
    cloudId: data.cloud_id,
    syncStatus: data.sync_status,
  };
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const { data } = await api.get<OnboardingStatusResponse>("/onboarding/status");
  return {
    github: {
      connected: data.github.connected,
      needsReauth: data.github.needs_reauth,
      repoConnected: data.github.repo_connected,
      repoFullName: data.github.repo_full_name,
      parseStatus: data.github.parse_status,
      webhookStatus: data.github.webhook_status,
      webhookError: data.github.webhook_error,
    },
    jira: {
      connected: data.jira.connected,
      needsReauth: data.jira.needs_reauth,
      projectConnected: data.jira.project_connected,
      syncStatus: data.jira.sync_status,
    },
  };
}


/** Disconnect a repository.
 *
 * The backend removes the webhook, the graph, the extracted facts and the
 * checked-out source. The name is split into path segments so it is encoded
 * rather than interpolated raw.
 */
export async function disconnectRepo(repoFullName: string): Promise<void> {
  const [owner, name] = repoFullName.split("/");
  await api.delete(
    `${SERVICES.GITHUB}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
  );
}
