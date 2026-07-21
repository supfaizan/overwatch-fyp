"use client";

import { ArrowRight } from "lucide-react";
import { GithubMark } from "@/components/shared/GithubMark";
import { SAMPLE_REPOS } from "../static";
import { useConnectSample } from "../hooks";

export function SampleRepos() {
  const connectSample = useConnectSample();

  return (
    <div>
      <p className="ow-mono-micro text-text-dim">
        OR START FROM A COLD-START CORPUS REPO
      </p>
      <div className="mt-3 space-y-2">
        {SAMPLE_REPOS.map((repo) => (
          <button
            key={repo.id}
            onClick={() => connectSample(repo)}
            className="ow-panel group flex w-full items-center justify-between p-3 text-left"
          >
            <span className="flex items-center gap-3">
              <GithubMark className="size-4 text-text-lo" />
              <span>
                <span className="block ow-mono-data text-text-hi">
                  {repo.fullName}
                </span>
                <span className="ow-mono-micro text-text-dim">
                  {repo.language}
                </span>
              </span>
            </span>
            <ArrowRight className="size-4 text-text-dim transition-transform group-hover:translate-x-1 group-hover:text-signal" />
          </button>
        ))}
      </div>
    </div>
  );
}
