'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Button from '@/shared/components/button';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import StatusTag from '@/shared/components/status-tag';
import { useConnectJiraProject, useDisconnectJira, useJiraProjects, useOnboardingStatus, useStartJiraAuthorization } from '../hooks';
import { skipJira } from '../jira-skip';
import StepCard from './step-card';

// what the backend's Jira callback reports in ?jira=
const OUTCOMES: Record<string, () => void> = {
  connected: () => toast.success('Jira authorized. Pick a project to finish.'),
  denied: () => toast.error('Jira authorization was cancelled.'),
  error: () => toast.error("Couldn't connect Jira. Please try again."),
};

export default function JiraStep({ outcome }: { outcome?: string }) {
  const router = useRouter();
  const status = useOnboardingStatus();
  const jira = status.data?.jira;
  const projects = useJiraProjects(Boolean(jira?.connected && !jira.project));
  const authorize = useStartJiraAuthorization();
  const next = () => router.push('/onboarding/indexing');
  const connect = useConnectJiraProject(next);
  const [selected, setSelected] = useState('');
  const selectedProject = projects.data?.find((project) => project.key === selected);

  useEffect(() => {
    if (!outcome) return;
    OUTCOMES[outcome]?.();
    router.replace('/onboarding/jira'); // drop ?jira= so a refresh doesn't toast again
  }, [outcome, router]);

  const skip = () => {
    skipJira();
    next();
  };

  if (!jira) {
    return (
      <StepCard title="Connect Jira" description="Loading…">
        <Skeleton className="h-9 w-full" />
      </StepCard>
    );
  }

  if (jira.project) {
    return (
      <StepCard
        title="Jira connected"
        description="Tickets sync in the background and get mapped to the code they touch."
        actions={
          <>
            <DisconnectJira />
            <Button variant="primary" onClick={next}>
              Continue
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
          <span className="flex-1 font-medium">{jira.project.key}</span>
          <StatusTag status={jira.project.sync_status} done="Synced" />
        </div>
      </StepCard>
    );
  }

  if (!jira.connected) {
    return (
      <StepCard
        title={jira.needs_reauth ? 'Reconnect Jira' : 'Connect Jira'}
        description="Optional. Link a Jira project so Overwatch can show which code each ticket touches."
        actions={
          <>
            <Button variant="tertiary" onClick={skip}>
              Skip for now
            </Button>
            <Button variant="primary" loading={authorize.isPending} onClick={() => authorize.mutate()}>
              {jira.needs_reauth ? 'Reconnect Jira' : 'Connect Jira'}
            </Button>
          </>
        }
      />
    );
  }

  return (
    <StepCard
      title="Pick a Jira project"
      description="Overwatch syncs this project's tickets."
      actions={
        <>
          <Button variant="tertiary" onClick={skip}>
            Skip for now
          </Button>
          <Button variant="primary" disabled={!selectedProject} loading={connect.isPending} onClick={() => selectedProject && connect.mutate(selectedProject)}>
            Connect project
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="jira-project" className="text-sm font-medium">
          Project
        </label>
        <Select value={selected} onValueChange={setSelected} disabled={projects.isPending}>
          <SelectTrigger id="jira-project" placeholder={projects.isPending ? 'Loading projects…' : 'Select a project'} />
          <SelectContent>
            {projects.data?.map((project) => (
              <SelectItem key={project.key} value={project.key}>
                {project.key}
                {project.name ? ` · ${project.name}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {projects.isError && <p className="text-sm text-danger">{projects.error.message}</p>}
        {projects.isSuccess && projects.data.length === 0 && (
          <p className="text-sm text-muted">This Atlassian account has no Jira projects.</p>
        )}
      </div>
    </StepCard>
  );
}

function DisconnectJira() {
  const disconnect = useDisconnectJira();
  return (
    <ConfirmDialog
      trigger={<Button variant="tertiary">Disconnect Jira</Button>}
      title="Disconnect Jira?"
      description="Ticket sync stops. Tickets already imported are kept, so reconnecting picks up where you left off."
      confirmLabel="Disconnect Jira"
      pending={disconnect.isPending}
      onConfirm={(close) => disconnect.mutate(undefined, { onSuccess: close })}
    />
  );
}
