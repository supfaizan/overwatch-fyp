export type Provider = "github" | "gitlab" | "bitbucket";

export type IndexState = "queued" | "indexing" | "ready" | "failed";

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  url: string;
  provider: Provider;
  language: string;
  state: IndexState;
  lastIndexed?: string;
}

export interface ConnectRepoResponse {
  repo: Repository;
}
