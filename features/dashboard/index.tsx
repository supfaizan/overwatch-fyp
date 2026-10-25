'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import SegmentedButton from '@/shared/components/segmented-button';
import Spinner from '@/shared/components/spinner';
import { useConnectedRepos } from '@/shared/repos/hooks';
import { pickRepo, readLastRepo, saveLastRepo } from '@/shared/repos/lib';
import { useSession } from '@/shared/session/store';
import { useWorkspace } from '@/shared/workspaces/store';
import { ChatCircleDots, Graph, TreeStructure } from '@phosphor-icons/react/ssr';
import { ReactFlowProvider } from '@xyflow/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatPanel from './chat';
import ChatDock from './chat/components/chat-dock';
import DiagramCanvas from './components/diagram-canvas';
import { DIAGRAM, type Diagram } from './lib/canvas';
import { useViewStore } from './store';

const CHAT_PARAM = 'chat';
const CHAT_OPEN = 'open';
const DIAGRAM_PARAM = 'diagram';

const DIAGRAM_OPTIONS = [
  { value: DIAGRAM.graph, label: 'Graph', icon: <Graph aria-hidden /> },
  { value: DIAGRAM.tree, label: 'Tree', icon: <TreeStructure aria-hidden /> },
];

/**
 * The architecture dashboard for `?repo=owner/name`, else the last repo used, else the first with a graph.
 * `?chat=open` opens the chat beside it (⌘K links here); `?diagram=tree` draws the folder tree, not the web.
 */
export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get('repo');
  const userId = useSession((state) => {
    return state.user?.id ?? '';
  });
  const workspaceId = useWorkspace((state) => {
    return state.id ?? '';
  });
  const lastUsed = readLastRepo(userId, workspaceId);
  const repos = useConnectedRepos();
  const repoName = repos.data
    ? pickRepo(repos.data, requested, lastUsed)?.repo_full_name
    : undefined;
  const chatOpen = searchParams.get(CHAT_PARAM) === CHAT_OPEN;
  // once opened, the chat stays mounted and is only hidden, so closing it mid-answer loses nothing
  const [chatStarted, setChatStarted] = useState(chatOpen);
  if (chatOpen && !chatStarted) {
    setChatStarted(true);
  }
  const diagram: Diagram = searchParams.get(DIAGRAM_PARAM) === DIAGRAM.tree
    ? DIAGRAM.tree
    : DIAGRAM.graph;

  const setChatOpen = (open: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (open) {
      params.set(CHAT_PARAM, CHAT_OPEN);
    } else {
      params.delete(CHAT_PARAM);
    }
    router.replace(`${pathname}?${params}`);
  };

  const setDiagram = (next: Diagram) => {
    const params = new URLSearchParams(searchParams);
    // the web is the default, so only the tree is named in the URL
    if (next === DIAGRAM.tree) {
      params.set(DIAGRAM_PARAM, next);
    } else {
      params.delete(DIAGRAM_PARAM);
    }
    router.replace(`${pathname}?${params}`);
  };

  useEffect(() => {
    if (!repos.data) {
      return;
    }
    // nothing to show yet: onboarding knows which step comes next
    if (!repoName) {
      router.replace('/onboarding');
      return;
    }
    saveLastRepo(userId, workspaceId, repoName);
    // keep the URL naming what's on screen, so it can be shared; only when it differs, or this would loop
    if (repoName !== requested) {
      const params = new URLSearchParams(searchParams);
      params.set('repo', repoName);
      router.replace(`${pathname}?${params}`);
    }
  }, [repos.data, repoName, requested, searchParams, pathname, userId, workspaceId, router]);

  // open folders belong to one repo's ids
  useEffect(() => {
    useViewStore.getState().reset();
  }, [repoName]);

  if (repos.isError) {
    return (
      <Banner
        type="error"
        className="mx-auto mt-10 max-w-xl"
        action={
          <Button
            size="sm"
            onClick={() => {
              return repos.refetch();
            }}
          >
            Retry
          </Button>
        }
      >
        {repos.error.message}
      </Banner>
    );
  }
  if (!repoName) {
    return <Spinner className="mx-auto mt-10 size-6 text-muted" />;
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <header className="flex items-center gap-2">
        <h1 className="flex-1 truncate font-mono text-sm font-medium">{repoName}</h1>
        <SegmentedButton
          aria-label="Diagram"
          size="sm"
          options={DIAGRAM_OPTIONS}
          value={diagram}
          onValueChange={setDiagram}
        />
        <Button
          size="sm"
          variant={chatOpen ? 'secondary' : 'primary'}
          aria-pressed={chatOpen}
          onClick={() => {
            return setChatOpen(!chatOpen);
          }}
        >
          <ChatCircleDots /> Ask
        </Button>
      </header>
      <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-surface">
        <div className="min-w-0 flex-1">
          <ReactFlowProvider>
            <DiagramCanvas key={repoName} repo={repoName} diagram={diagram} />
          </ReactFlowProvider>
        </div>
        {chatStarted && (
          <ChatDock hidden={!chatOpen}>
            <ChatPanel
              key={repoName}
              repo={repoName}
              onClose={() => {
                return setChatOpen(false);
              }}
            />
          </ChatDock>
        )}
      </div>
    </div>
  );
}
