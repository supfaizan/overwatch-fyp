import { api } from "@/lib/axios";
import { SERVICES } from "@/lib/services";
import { USE_MOCK } from "@/constants";
import { delay, makeMockToken } from "@/lib/mock";
import type { AuthResponse } from "@/types";
import type { LoginInput, RegisterInput } from "../schemas";

export async function login(input: LoginInput): Promise<AuthResponse> {
  if (USE_MOCK) {
    await delay();
    const handle = input.email.split("@")[0];
    const user = {
      id: "u_local",
      name: handle,
      email: input.email,
      githubHandle: handle,
      avatarUrl: `https://github.com/${handle}.png`,
    };
    return { token: makeMockToken(user), user };
  }
  const { data } = await api.post<AuthResponse>(`${SERVICES.AUTH}/login`, input);
  return data;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  if (USE_MOCK) {
    await delay();
    const handle = input.name.toLowerCase().replace(/\s+/g, "");
    const user = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      githubHandle: handle,
      avatarUrl: `https://github.com/${handle}.png`,
    };
    return { token: makeMockToken(user), user };
  }
  const { data } = await api.post<AuthResponse>(
    `${SERVICES.AUTH}/register`,
    input,
  );
  return data;
}
