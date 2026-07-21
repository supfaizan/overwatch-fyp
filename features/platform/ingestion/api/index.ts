import { api } from "@/lib/axios";
import { SERVICES } from "@/lib/services";
import { USE_MOCK } from "@/constants";
import { delay } from "@/lib/mock";
import type { ConnectRepoInput } from "../schemas";
import type { ConnectRepoResponse, Provider, Repository } from "../types";

function parseRepo(url: string): { name: string; fullName: string; provider: Provider } {
  const match = url.match(/(github|gitlab|bitbucket)\.com\/([^/]+)\/([^/?#]+)/);
  const provider = (match?.[1] ?? "github") as Provider;
  const owner = match?.[2] ?? "team";
  const name = (match?.[3] ?? "repository").replace(/\.git$/, "");
  return { name, fullName: `${owner}/${name}`, provider };
}

export async function connectRepo(
  input: ConnectRepoInput,
): Promise<ConnectRepoResponse> {
  if (USE_MOCK) {
    await delay(900);
    const { name, fullName, provider } = parseRepo(input.url);
    const repo: Repository = {
      id: crypto.randomUUID(),
      name,
      fullName,
      url: input.url,
      provider,
      language: "TypeScript",
      state: "queued",
    };
    return { repo };
  }
  const { data } = await api.post<ConnectRepoResponse>(
    `${SERVICES.REPOS}/connect`,
    input,
  );
  return data;
}

export async function getRepos(): Promise<Repository[]> {
  if (USE_MOCK) {
    await delay(400);
    return [];
  }
  const { data } = await api.get<Repository[]>(`${SERVICES.REPOS}`);
  return data;
}
