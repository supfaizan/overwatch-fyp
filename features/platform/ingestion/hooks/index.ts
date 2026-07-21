"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRepoStore } from "@/stores/repo-store";
import {
  connectJiraProject,
  connectRepo,
  disconnectJira,
  getGithubRepos,
  getJiraProjects,
  getOnboardingStatus,
  retryGithubWebhook,
  startJiraOAuth,
} from "../api";
import { onboardingKeys } from "../api/query-keys";
import type { OnboardingStatus } from "../types";

const RUNNING_STATUSES = new Set(["pending", "in_progress"]);

export function hasPendingOnboarding(status?: OnboardingStatus): boolean {
  return Boolean(
    status &&
      (RUNNING_STATUSES.has(status.github.parseStatus ?? "") ||
        RUNNING_STATUSES.has(status.jira.syncStatus ?? "")),
  );
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: onboardingKeys.status(),
    queryFn: getOnboardingStatus,
    refetchInterval: (query) =>
      hasPendingOnboarding(query.state.data) ? 3_000 : false,
  });
}

export function useGithubRepos(enabled: boolean) {
  return useQuery({
    queryKey: onboardingKeys.githubRepos(),
    queryFn: getGithubRepos,
    enabled,
  });
}

export function useConnectRepo() {
  const queryClient = useQueryClient();
  const setActiveRepo = useRepoStore((state) => state.setActiveRepo);

  return useMutation({
    mutationFn: connectRepo,
    onSuccess: (repo) => {
      setActiveRepo({
        id: repo.repoFullName,
        fullName: repo.repoFullName,
        state: repo.parseStatus === "failed" ? "failed" : "indexing",
      });
      void queryClient.invalidateQueries({ queryKey: onboardingKeys.status() });
      toast.success(`Connected ${repo.repoFullName}. Parsing started in the background.`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRetryGithubWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retryGithubWebhook,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: onboardingKeys.status() });
      toast.success("GitHub webhook connected.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useStartJiraOAuth() {
  return useMutation({
    mutationFn: startJiraOAuth,
    onSuccess: (authorizationUrl) => window.location.assign(authorizationUrl),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDisconnectJira() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectJira,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: onboardingKeys.jiraProjects() });
      queryClient.removeQueries({ queryKey: ["tickets"] });
      void queryClient.invalidateQueries({ queryKey: onboardingKeys.status() });
      toast.success("Jira disconnected. Imported ticket history was retained.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useJiraProjects(enabled: boolean) {
  return useQuery({
    queryKey: onboardingKeys.jiraProjects(),
    queryFn: getJiraProjects,
    enabled,
  });
}

export function useConnectJiraProject() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectJiraProject,
    onSuccess: (project) => {
      queryClient.removeQueries({ queryKey: ["tickets"] });
      void queryClient.invalidateQueries({ queryKey: onboardingKeys.status() });
      toast.success(`Connected Jira project ${project.projectKey}. Ticket sync started.`);
      router.push("/dashboard");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
