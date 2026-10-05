"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useConnectJiraProject,
  useDisconnectJira,
  useJiraProjects,
  useStartJiraOAuth,
} from "../hooks";
import type { OnboardingStatus } from "../types";

interface JiraProjectStepProps {
  status: OnboardingStatus["jira"];
}

function DisconnectJiraButton() {
  const [open, setOpen] = useState(false);
  const disconnect = useDisconnectJira();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full text-critical">
          <Unplug className="size-4" /> DISCONNECT JIRA
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect Jira?</DialogTitle>
          <DialogDescription>
            Synchronization will stop and the current project will be hidden.
            Imported ticket history will be retained for reconnection.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">CANCEL</Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={disconnect.isPending}
            onClick={() => disconnect.mutate(undefined, {
              onSuccess: () => setOpen(false),
            })}
          >
            {disconnect.isPending && <Loader2 className="size-4 animate-spin" />}
            DISCONNECT
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function JiraProjectStep({ status }: JiraProjectStepProps) {
  const [selectedProject, setSelectedProject] = useState("");
  const startOAuth = useStartJiraOAuth();
  const projects = useJiraProjects(status.connected && !status.projectConnected);
  const connect = useConnectJiraProject();

  if (status.projectConnected) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-md border border-signal-border bg-signal-soft p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-signal" />
          <div>
            <p className="ow-mono-data text-text-hi">Jira project connected</p>
            <p className="ow-micro mt-1 text-text-mid">
              TICKET SYNC {status.syncStatus?.replace("_", " ") ?? "QUEUED"}
            </p>
          </div>
        </div>

        <DisconnectJiraButton />
      </div>
    );
  }

  if (!status.connected || status.needsReauth) {
    return (
      <div className="space-y-4">
        <p className="ow-body text-text-mid">
          Authorize Jira to choose a project and synchronize its tickets. You can
          skip this and connect Jira later.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full font-mono text-[12px] tracking-wide"
          disabled={startOAuth.isPending}
          onClick={() => startOAuth.mutate()}
        >
          {startOAuth.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ExternalLink className="size-4" />
          )}
          {status.needsReauth ? "REAUTHORIZE JIRA" : "CONNECT JIRA"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="jira-project" className="ow-micro text-text-lo">
          JIRA PROJECT
        </label>
        <select
          id="jira-project"
          value={selectedProject}
          onChange={(event) => setSelectedProject(event.target.value)}
          disabled={projects.isLoading || projects.isError}
          className="mt-2 h-10 w-full appearance-none rounded-md border border-line-2 bg-surface-1 px-3 font-mono text-[13px] text-text-hi outline-none focus:border-signal-border disabled:opacity-50"
        >
          <option value="">
            {projects.isLoading ? "Loading Jira projects…" : "Select a project"}
          </option>
          {projects.data?.map((project) => (
            <option key={project.id ?? project.key} value={project.key}>
              {project.key} — {project.name ?? "Unnamed project"}
            </option>
          ))}
        </select>
      </div>

      {projects.isError && (
        <p className="ow-body text-critical">{projects.error.message}</p>
      )}

      {projects.data?.length === 0 && (
        <p className="ow-body text-text-mid">
          No Jira projects are available for this Atlassian account.
        </p>
      )}

      <Button
        type="button"
        className="w-full font-mono text-[12px] tracking-wide"
        disabled={!selectedProject || connect.isPending}
        onClick={() => connect.mutate(selectedProject)}
      >
        {connect.isPending && <Loader2 className="size-4 animate-spin" />}
        CONNECT JIRA PROJECT
      </Button>

      <DisconnectJiraButton />
    </div>
  );
}
