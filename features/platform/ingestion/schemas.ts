import { z } from "zod";

export const connectRepoSchema = z.object({
  url: z
    .url("Enter a valid repository URL")
    .refine(
      (v) => /(github|gitlab|bitbucket)\.com\/[^/]+\/[^/]+/.test(v),
      "Must be a GitHub, GitLab or Bitbucket repository URL",
    ),
});

export type ConnectRepoInput = z.infer<typeof connectRepoSchema>;
