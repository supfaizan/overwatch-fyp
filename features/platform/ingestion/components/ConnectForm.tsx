"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GithubRepoStep } from "./GithubRepoStep";
import { JiraProjectStep } from "./JiraProjectStep";
import { useOnboardingStatus } from "../hooks";

export function ConnectForm() {
  const router = useRouter();
  const status = useOnboardingStatus();

  useEffect(() => {
    const jiraResult = new URLSearchParams(window.location.search).get("jira");
    if (!jiraResult) return;

    if (jiraResult === "connected") {
      toast.success("Jira authorized. Select a project to finish connecting it.");
    } else if (jiraResult === "denied") {
      toast.error("Jira authorization was cancelled.");
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  if (status.isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 text-text-mid">
        <Loader2 className="size-5 animate-spin text-signal" />
        <span className="ow-mono-data">Loading your integrations…</span>
      </div>
    );
  }

  if (status.isError || !status.data) {
    return (
      <div className="space-y-4 py-8 text-center">
        <AlertCircle className="mx-auto size-7 text-critical" />
        <p className="ow-body text-text-mid">
          {status.error?.message ?? "Unable to load onboarding status."}
        </p>
        <Button variant="outline" onClick={() => status.refetch()}>
          RETRY
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-6 place-items-center rounded-full bg-signal font-mono text-[11px] font-bold text-signal-ink">
            1
          </span>
          <div>
            <h2 className="ow-mono-data text-text-hi">Select a GitHub repository</h2>
            <p className="ow-micro text-text-dim">REQUIRED</p>
          </div>
        </div>
        <GithubRepoStep status={status.data.github} />
      </section>

      <div className="h-px bg-line-1" />

      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-6 place-items-center rounded-full border border-line-2 bg-surface-2 font-mono text-[11px] text-text-mid">
            2
          </span>
          <div>
            <h2 className="ow-mono-data text-text-hi">Select a Jira project</h2>
            <p className="ow-micro text-text-dim">OPTIONAL</p>
          </div>
        </div>
        <JiraProjectStep status={status.data.jira} />
      </section>

      <div className="h-px bg-line-1" />

      <Button
        type="button"
        variant="outline"
        className="w-full font-mono text-[12px] tracking-wide"
        disabled={!status.data.github.repoConnected}
        onClick={() => router.push("/dashboard")}
      >
        {status.data.jira.projectConnected ? "CONTINUE TO DASHBOARD" : "SKIP JIRA & CONTINUE"}
        <ArrowRight className="size-4" />
      </Button>

      <p className="ow-micro text-center text-text-dim">
        PARSING AND TICKET SYNC CONTINUE SECURELY IN THE BACKGROUND
      </p>
    </div>
  );
}
