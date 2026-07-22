export const onboardingKeys = {
  all: ["onboarding"] as const,
  status: () => [...onboardingKeys.all, "status"] as const,
  githubRepos: () => [...onboardingKeys.all, "github-repos"] as const,
  connectedRepos: () => [...onboardingKeys.all, "connected-repos"] as const,
  jiraProjects: () => [...onboardingKeys.all, "jira-projects"] as const,
};
