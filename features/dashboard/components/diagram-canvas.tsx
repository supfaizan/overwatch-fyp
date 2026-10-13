'use client';

import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Spinner from '@/shared/components/spinner';
import { isRunning, JOB_STATUS } from '@/shared/lib/job-status';
import { useGraphView } from '../hooks';
import { FOCUS_STROKE, TREE_STROKE, edgeStyle } from '../lib/appearance';
import { describeEdge, neighbourhood, relationTo } from '../lib/edges';
import { isInside, useViewStore } from '../store';
import type { CanvasNode, EdgeType, GraphView, RelationEdge } from '../types';
import NodeCard from './node-card';
import OverflowNode from './overflow-node';

const nodeTypes = { graphNode: NodeCard, overflow: OverflowNode };

const FIT = { padding: 0.18, minZoom: 0.55 };
/** past this many boxes, skip the refit animation, draw only what's on screen and show the minimap */
const DENSE = 60;
/** relationships at rest are present but quiet, so the folder tree reads first */
const AT_REST_OPACITY = 0.22;
const RECEDED = { node: 0.18, edge: 0.07 };

export default function DiagramCanvas({ repo }: { repo: string }) {
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useGraphView(repo);
  const hovered = useViewStore((state) => state.hovered);
  const selected = useViewStore((state) => state.selected);
  const highlighted = useViewStore((state) => state.highlighted);
  const { open, hover, select } = useViewStore.getState();
  const { resolvedTheme } = useTheme();

  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // hover wins over the chat's highlight, which wins over the selection, so you can look around without losing your place
  const focusId = hovered ?? (highlighted.length > 0 ? null : selected);
  const inFocus = useMemo(() => neighbourhood(data?.edges ?? [], focusId), [data, focusId]);
  // which nodes are on screen, not how they look: restyling must not refit the viewport
  const signature = useMemo(() => (data?.nodes ?? []).map((node) => node.id).join('|'), [data]);
  const dense = (data?.nodes.length ?? 0) > DENSE;

  useEffect(() => {
    if (!data) return;
    // a closed folder holding a highlighted node stands in for it
    const lit = (id: string) => highlighted.some((nodeId) => isInside(nodeId, id));
    const opacityOf = (id: string) => {
      if (focusId) return inFocus.has(id) ? 1 : RECEDED.node;
      return highlighted.length === 0 || lit(id) ? 1 : RECEDED.node;
    };
    setNodes((current) => restyleNodes(current, data.nodes, opacityOf));
    const relations = styleEdges(data.edges, focusId);
    // quietest first, so lines in focus paint over the rest
    setEdges([...treeEdges(data.view.containment), ...relations.filter((edge) => !edge.zIndex), ...relations.filter((edge) => edge.zIndex)]);
  }, [data, focusId, inFocus, highlighted, setNodes, setEdges]);

  if (isPending) return <Notice><Spinner className="size-5 text-muted" /> Drawing the architecture…</Notice>;
  if (isError) {
    return (
      <Notice>
        <Banner type="error" action={<Button size="sm" onClick={() => refetch()}>Retry</Button>}>
          {error.message}
        </Banner>
      </Notice>
    );
  }
  if (data.nodes.length === 0) {
    const status = data.view.parse_status;
    if (status === JOB_STATUS.failed) {
      return (
        <Notice>
          <Banner type="error" action={<Button size="sm" asChild><Link href="/settings/repositories">Repositories</Link></Button>}>
            Indexing this repository failed. Retry it from Settings.
          </Banner>
        </Notice>
      );
    }
    const indexing = isRunning(status);
    return (
      <Notice>
        {indexing && <Spinner className="size-5 text-muted" />}
        {indexing ? 'Indexing the repository. The diagram appears when the first pass finishes.' : 'Nothing to draw at this level.'}
      </Notice>
    );
  }

  return (
    <div className="relative h-full">
      <ReactFlow<CanvasNode, Edge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => node.type === 'graphNode' && select(node.id)}
        onNodeDoubleClick={(_, node) => node.type === 'graphNode' && node.data.expandable && !node.data.expanded && open(node.id)}
        onNodeMouseEnter={(_, node) => hover(node.id)}
        onNodeMouseLeave={() => hover(null)}
        onPaneClick={() => {
          select(null);
          hover(null);
        }}
        nodesConnectable={false}
        fitView
        fitViewOptions={FIT}
        onlyRenderVisibleElements={dense}
        minZoom={0.2}
        maxZoom={1.6}
        colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
        proOptions={{ hideAttribution: true }}
      >
        <FitToContent signature={signature} dense={dense} />
        <FocusOnRequest view={data.view} ready={!isPlaceholderData} signature={signature} />
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--color-border-strong)" />
        <Controls showInteractive={false} />
        {/* only worth the space once there's more graph than fits */}
        {dense && <MiniMap pannable zoomable nodeStrokeWidth={0} />}
      </ReactFlow>
      <EdgeLegend view={data.view} edges={data.edges} focused={focusId !== null} />
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted">{children}</div>;
}

/**
 * React Flow only fits on mount, and opening a folder can double the picture's width. Waits for the
 * new nodes to be measured, and fits once per set of nodes so it never yanks a viewport the user moved.
 */
function FitToContent({ signature, dense }: { signature: string; dense: boolean }) {
  const { fitView } = useReactFlow();
  const measured = useNodesInitialized();
  const fitted = useRef<string | null>(null);

  useEffect(() => {
    if (!measured || fitted.current === signature) return;
    fitted.current = signature;
    void fitView({ ...FIT, duration: dense ? 0 : 220 });
  }, [signature, measured, dense, fitView]);

  return null;
}

/**
 * Settles a chat reference click: once the view with its folders open has landed, selects the node,
 * or the nearest folder holding it that could be drawn (a capped folder may not show it), and pans there.
 */
function FocusOnRequest({ view, ready, signature }: { view: GraphView; ready: boolean; signature: string }) {
  const request = useViewStore((state) => state.focusRequest);
  const { fitView, getNode } = useReactFlow();
  const measured = useNodesInitialized();

  useEffect(() => {
    if (!request || !ready || !measured) return;
    const drawn = new Set(view.nodes.map((node) => node.id));
    const target = [request.nodeId, ...[...request.ancestors].reverse()].find((id) => drawn.has(id)) ?? null;
    // React Flow takes the new nodes an effect later; wait for this one to be there to pan to
    if (target && !getNode(target)) return;
    useViewStore.getState().settleFocus(target);
    if (target) void fitView({ nodes: [{ id: target }], padding: 0.6, maxZoom: 1.2, duration: 300 });
  }, [request, ready, measured, view, signature, fitView, getNode]);

  return null;
}

/** Reuse every node whose look didn't change: React Flow re-measures any node handed over as a new object. */
function restyleNodes(current: CanvasNode[], next: CanvasNode[], opacityOf: (id: string) => number): CanvasNode[] {
  const previous = new Map(current.map((node) => [node.id, node]));
  return next.map((node) => {
    const opacity = opacityOf(node.id);
    const prior = previous.get(node.id);
    if (!prior || prior.data !== node.data) return { ...node, style: { opacity } };
    return prior.style?.opacity === opacity ? prior : { ...prior, style: { ...prior.style, opacity } };
  });
}

function styleEdges(edges: RelationEdge[], focusId: string | null): Edge[] {
  return edges.map((edge) => {
    const detail = edge.data ?? { types: [], weight: 0, collapsed: false };
    const relation = relationTo(edge, focusId);
    const connected = relation === 'outgoing' || relation === 'incoming';
    const style = edgeStyle(detail.types[0]);
    const stroke = relation === 'outgoing' ? FOCUS_STROKE.outgoing : relation === 'incoming' ? FOCUS_STROKE.incoming : style.stroke;

    return {
      ...edge,
      zIndex: connected ? 1 : 0,
      // lines aren't clickable; React Flow's wide hit path would steal hover from the nodes beneath
      interactionWidth: 0,
      // only lines answering the current question are named
      label: connected ? describeEdge(detail) : undefined,
      labelStyle: { fill: stroke, fontSize: 10 },
      labelBgStyle: { fill: 'var(--color-surface)' },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 3,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: stroke },
      style: {
        stroke,
        strokeWidth: connected ? 2 : 1,
        strokeDasharray: style.dash,
        opacity: connected ? 1 : focusId ? RECEDED.edge : AT_REST_OPACITY,
        transition: 'opacity 140ms, stroke 140ms',
      },
    };
  });
}

function treeEdges(lines: GraphView['containment']): Edge[] {
  return lines.map((line) => ({
    id: `${line.parent}>${line.child}`,
    source: line.parent,
    target: line.child,
    selectable: false,
    focusable: false,
    interactionWidth: 0,
    style: { stroke: TREE_STROKE, strokeWidth: 1.5 },
  }));
}

/** Explains only the lines on screen; with a node in focus, the focus colours instead. */
function EdgeLegend({ view, edges, focused }: { view: GraphView; edges: RelationEdge[]; focused: boolean }) {
  const kinds = useMemo(() => [...new Set(edges.flatMap((edge) => edge.data?.types ?? []))].sort() as EdgeType[], [edges]);
  if (kinds.length === 0 && !view.truncated) return null;

  return (
    <div className="pointer-events-none absolute top-3 right-3 flex max-w-64 flex-col items-end gap-1.5 rounded-md border border-border bg-surface/90 px-3 py-2 text-xs text-muted backdrop-blur-sm">
      {focused ? (
        <>
          <LegendLine stroke={FOCUS_STROKE.outgoing}>this uses →</LegendLine>
          <LegendLine stroke={FOCUS_STROKE.incoming}>→ uses this</LegendLine>
        </>
      ) : (
        <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
          {kinds.map((kind) => {
            const style = edgeStyle(kind);
            return (
              <LegendLine key={kind} stroke={style.stroke} dashed={Boolean(style.dash)}>
                {style.label}
              </LegendLine>
            );
          })}
        </div>
      )}
      {view.truncated && <span className="text-warning-strong">View truncated: close a folder to see the rest</span>}
    </div>
  );
}

function LegendLine({ stroke, dashed, children }: { stroke: string; dashed?: boolean; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg aria-hidden width="14" height="2">
        <line x1="0" y1="1" x2="14" y2="1" stroke={stroke} strokeWidth="2" strokeDasharray={dashed ? '3 3' : undefined} />
      </svg>
      {children}
    </span>
  );
}
