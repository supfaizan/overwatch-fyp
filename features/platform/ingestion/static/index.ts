import type { Repository } from "../types";

/** Public repos offered for one-click connect — these double as the T-GNN
 *  cold-start corpus (guide.md §11). */
export const SAMPLE_REPOS: Repository[] = [
  {
    id: "nestjs",
    name: "nest",
    fullName: "nestjs/nest",
    url: "https://github.com/nestjs/nest",
    provider: "github",
    language: "TypeScript",
    state: "ready",
  },
  {
    id: "django",
    name: "django",
    fullName: "django/django",
    url: "https://github.com/django/django",
    provider: "github",
    language: "Python",
    state: "ready",
  },
  {
    id: "rails",
    name: "rails",
    fullName: "rails/rails",
    url: "https://github.com/rails/rails",
    provider: "github",
    language: "Ruby",
    state: "ready",
  },
];

export const PROVIDERS = [
  { id: "github", label: "GitHub" },
  { id: "gitlab", label: "GitLab" },
  { id: "bitbucket", label: "Bitbucket" },
] as const;
