"use client";

import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useNodesInitialized,
  useReactFlow,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2, GitBranch, TriangleAlert } from "lucide-react";
import { GraphNodeCard } from "../graph/components/GraphNodeCard";
import { OverflowNode } from "../graph/components/OverflowNode";
import { ViewControls } from "../graph/components/ViewControls";
import { useGraphView } from "../graph/hooks";
import {
  FOCUS_STROKE,
  RECEDED,
  edgeStyle,
  spotlight,
} from "../graph/lib/appearance";
import {
  containmentEdges,
  describeEdge,
  neighbourhood,
  relationTo,
} from "../graph/lib/edges";
import { isGraphNode } from "../graph/lib/nodes";
import { useViewStore } from "../graph/stores/view-store";
import type { CanvasNode, ViewEdgeType, ViewFlowEdge } from "../graph/types";
import { useDashboardStore } from "../stores/dashboard-store";

const nodeTypes = { graphNode: GraphNodeCard, overflow: OverflowNode };

const FIT_PADDING = 0.18;

/** The furthest the view will zoom out to fit.
 *
 *  Below this a node is a grey rectangle with unreadable text, which is worse
 *  than showing part of the graph and letting it be panned. A wide repository
 *  does not fit on a screen, and pretending otherwise helps nobody. */
const MIN_FIT_ZOOM = 0.55;

/** Past this many boxes the canvas stops being a diagram and starts being a
 *  cost. The refit animation and off-screen nodes are the two things that
 *  make the difference between "big" and "frozen tab". */
const DENSE = 60;

/** How relationship lines are drawn when nothing is in focus.
 *
 *  The folder tree is what the view is *for*; dependencies are the question
 *  you ask of it. At rest they are present but quiet — enough to see that a
 *  node is connected, not enough to compete with the shape of the tree. Point
 *  at a node and its own come forward in full. */
const AT_REST = { opacity: 0.22, width: 1 } as const;

/** Refits the viewport whenever the set of nodes changes.
 *
 * Opening a folder can double the width of the picture, and React Flow only
 * fits on mount — without this, half the graph lands off-screen. It waits for
 * the new nodes to be measured, or it would fit to stale sizes. Rendered
 * inside `<ReactFlow>`, which is what puts it in the flow's context. */
function FitToContent({ signature, dense }: { signature: string; dense: boolean }) {
  const { fitView } = useReactFlow();
  const measured = useNodesInitialized();

  useEffect(() => {
    if (!measured) return;
    void fitView({
      padding: FIT_PADDING,
      minZoom: MIN_FIT_ZOOM,
      duration: dense ? 0 : 220,
    });
  }, [signature, measured, dense, fitView]);

  return null;
}

function styleEdges(
  edges: ViewFlowEdge[],
  focusId: string | null,
  flowStepIds: string[],
): Edge[] {
  // Consecutive pairs in the walkthrough — these get the travelling animation.
  const flowPairs = new Set(
    flowStepIds.slice(0, -1).map((id, index) => `${id}->${flowStepIds[index + 1]}`),
  );

  return edges.map((edge) => {
    const detail = edge.data!;
    const relation = relationTo(edge, focusId);
    const onFlow =
      flowPairs.has(`${edge.source}->${edge.target}`) ||
      flowPairs.has(`${edge.target}->${edge.source}`);
    const connected = relation === "outgoing" || relation === "incoming";
    const active = onFlow || connected;
    const recede = focusId !== null && !active;

    const stroke = onFlow
      ? "var(--ow-signal)"
      : relation === "outgoing"
        ? FOCUS_STROKE.outgoing
        : relation === "incoming"
          ? FOCUS_STROKE.incoming
          : edgeStyle(detail.kind).stroke;

    return {
      ...edge,
      type: "default",
      animated: onFlow,
      // No line is clickable, and the invisible interaction path React Flow
      // would draw along it covers every node it passes, taking the hover
      // those nodes should get.
      interactionWidth: 0,
      // Named only when it answers the question being asked. Labelling all
      // twenty-odd lines at rest buries the shape of the graph under text
      // nobody is reading; point at a node and its own lines say what they
      // are.
      label: connected ? describeEdge(detail) : undefined,
      labelStyle: {
        fill: connected ? stroke : "var(--ow-stale)",
        fontFamily: "var(--ow-font-mono)",
        fontSize: connected ? 9 : 8,
        letterSpacing: "0.08em",
        pointerEvents: "none" as const,
      },
      labelBgStyle: {
        fill: "var(--ow-ink-900)",
        pointerEvents: "none" as const,
      },
      labelBgBorderRadius: 3,
      labelBgPadding: [4, 2] as [number, number],
      // Every line says which way it points. Without this the graph shows
      // that two things are related and never which depends on which.
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: stroke,
      },
      style: {
        stroke,
        strokeWidth: active ? 2 : AT_REST.width,
        strokeDasharray: edgeStyle(detail.kind).dash,
        opacity: recede ? RECEDED.edge : active ? 1 : AT_REST.opacity,
        transition: "opacity 140ms, stroke 140ms, stroke-width 140ms",
      },
    };
  });
}

/** How strongly a node is drawn.
 *
 * Focus wins over a chat answer's spotlight: if you are pointing at something,
 * that is the question being asked right now. Unrelated nodes recede rather
 * than disappear, so the shape of the graph survives as context. */
function nodeOpacity(
  id: string,
  focusId: string | null,
  inFocus: Set<string>,
  lit: Set<string>,
): number {
  if (focusId) return inFocus.has(id) ? 1 : RECEDED.node;
  if (lit.size > 0) return lit.has(id) ? 1 : 0.35;
  return 1;
}

function CanvasNotice({
  icon: Icon,
  spin,
  children,
}: {
  icon: typeof Loader2;
  spin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid h-full place-items-center bg-ink-850 px-6">
      <div className="flex max-w-sm flex-col items-center gap-2 text-center">
        <Icon className={`size-4 text-signal ${spin ? "animate-spin" : ""}`} />
        <p className="ow-mono-micro text-text-dim">{children}</p>
      </div>
    </div>
  );
}

export function DiagramCanvas() {
  const { data, isLoading, isError } = useGraphView();
  const highlighted = useDashboardStore((state) => state.highlightedNodeIds);
  const flowStepIds = useDashboardStore((state) => state.flowStepIds);
  const selectNode = useDashboardStore((state) => state.selectNode);
  const setHighlighted = useDashboardStore((state) => state.setHighlighted);
  const selectedNodeId = useDashboardStore((state) => state.selectedNodeId);
  const open = useViewStore((state) => state.open);
  const reveal = useViewStore((state) => state.reveal);
  const hovered = useViewStore((state) => state.hovered);
  const hover = useViewStore((state) => state.hover);

  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const dense = (data?.nodes.length ?? 0) > DENSE;

  // What "open this to files" applies to. Only a real graph node can be a
  // scope; an overflow marker stands for several and is opened by clicking it.
  const selected = useMemo(() => {
    const node = data?.nodes.find((candidate) => candidate.id === selectedNodeId);
    return node && isGraphNode(node) ? { id: node.id, name: node.data.label } : null;
  }, [data, selectedNodeId]);

  // A chat answer names modules. Once a module is opened it is no longer on
  // the canvas, so its children carry the spotlight in its place.
  const lit = useMemo(
    () => spotlight((data?.nodes ?? []).map((node) => node.id), highlighted),
    [data, highlighted],
  );

  // Pointing at a node is enough to read its connections; selecting one holds
  // them. Hover wins, so you can look around without losing your place.
  const focusId = hovered ?? selectedNodeId;
  const inFocus = useMemo(
    () => neighbourhood(data?.edges ?? [], focusId),
    [data, focusId],
  );

  // Identifies *which* nodes are on screen, not how they look, so restyling
  // for a chat answer does not yank the viewport around.
  const signature = useMemo(
    () => (data?.nodes ?? []).map((node) => node.id).join("|"),
    [data],
  );

  useEffect(() => {
    if (!data) return;
    setNodes(
      data.nodes.map((node) => ({
        ...node,
        style: { opacity: nodeOpacity(node.id, focusId, inFocus, lit) },
      })),
    );
    // Paint order, quietest first: the tree, then the relationships at rest,
    // then whatever is in focus. All of them stay in the one layer beneath
    // the nodes, so a line never covers a card it passes.
    const relations = styleEdges(data.edges, focusId, flowStepIds);
    setEdges([
      ...containmentEdges(data.containment),
      ...relations.filter((edge) => !edge.animated && edge.style?.opacity !== 1),
      ...relations.filter((edge) => edge.animated || edge.style?.opacity === 1),
    ]);
  }, [data, focusId, inFocus, lit, flowStepIds, setNodes, setEdges]);

  if (isLoading) {
    return (
      <CanvasNotice icon={Loader2} spin>
        RENDERING ARCHITECTURE GRAPH…
      </CanvasNotice>
    );
  }

  if (isError) {
    return (
      <CanvasNotice icon={TriangleAlert}>
        COULD NOT LOAD THE GRAPH. CHECK THAT THE REPOSITORY IS STILL CONNECTED.
      </CanvasNotice>
    );
  }

  if (!data) {
    return (
      <CanvasNotice icon={GitBranch}>
        CONNECT A REPOSITORY TO BUILD ITS ARCHITECTURE GRAPH.
      </CanvasNotice>
    );
  }

  if (data.nodes.length === 0) {
    const parsing =
      data.parseStatus === "pending" || data.parseStatus === "in_progress";
    return (
      <CanvasNotice icon={parsing ? Loader2 : TriangleAlert} spin={parsing}>
        {parsing
          ? "PARSING REPOSITORY — THE GRAPH APPEARS AS SOON AS THE FIRST PASS COMPLETES."
          : "NOTHING TO DRAW AT THIS LEVEL. CLEAR THE FILTERS, OR CHECK THE REPOSITORIES SCREEN IF THE PARSE FAILED."}
      </CanvasNotice>
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
        onNodeClick={(_, node: Node) => {
          selectNode(node.id);
          setHighlighted([node.id]);
        }}
        onNodeDoubleClick={(_, node: Node) => {
          const canvasNode = node as CanvasNode;
          if (isGraphNode(canvasNode)) {
            if (canvasNode.data.expandable) open(canvasNode.id);
          } else {
            reveal(canvasNode.data.containerId);
          }
        }}
        onNodeMouseEnter={(_, node: Node) => hover(node.id)}
        onNodeMouseLeave={() => hover(null)}
        onPaneClick={() => {
          selectNode(null);
          setHighlighted([]);
          hover(null);
        }}
        fitView
        fitViewOptions={{ padding: FIT_PADDING, minZoom: MIN_FIT_ZOOM }}
        // Off-screen boxes cost nothing to not draw, and a dense view is
        // exactly when that matters.
        onlyRenderVisibleElements={dense}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={1.6}
        colorMode="dark"
      >
        <FitToContent signature={signature} dense={dense} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="var(--ow-line-1)"
        />
        <Controls
          showInteractive={false}
          className="!border-line-1 !bg-surface-1 [&_button]:!border-line-1 [&_button]:!bg-surface-1 [&_button:hover]:!bg-surface-2 [&_svg]:!fill-text-mid"
        />
        {/* Only worth its screen space once there is more graph than fits.
            Below that it covers the very nodes it is meant to help find. */}
        {dense && (
          <MiniMap
            pannable
            zoomable
            maskColor="rgba(7,9,13,0.7)"
            className="!bg-ink-900 !border !border-line-1"
            nodeColor={(node) =>
              node.type === "overflow" || node.data?.kind === "external"
                ? "#6B7280"
                : "#4ADE80"
            }
            nodeStrokeWidth={0}
          />
        )}
      </ReactFlow>

      <ViewControls expanded={data.expanded} selected={selected} />
      <EdgeLegend
        edges={data.edges}
        focused={focusId !== null}
        truncated={data.truncated}
      />
    </div>
  );
}

/** Only the relationships actually on screen, so the legend never explains
 *  a line the canvas is not drawing.
 *
 *  With a node in focus it explains the focus colours instead, because that
 *  is what the canvas is showing at that moment. */
function EdgeLegend({
  edges,
  focused,
  truncated,
}: {
  edges: ViewFlowEdge[];
  focused: boolean;
  truncated: boolean;
}) {
  const kinds = useMemo(() => {
    const seen = new Set<ViewEdgeType>();
    for (const edge of edges) for (const type of edge.data?.types ?? []) seen.add(type);
    return [...seen].sort();
  }, [edges]);

  if (kinds.length === 0 && !truncated) return null;

  if (focused) {
    return (
      <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-1 rounded-md border border-line-1 bg-ink-900/85 px-3 py-2 backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-px w-3.5 bg-signal" />
          <span className="ow-mono-micro text-text-mid">THIS USES →</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-px w-3.5 bg-warn" />
          <span className="ow-mono-micro text-text-mid">→ USES THIS</span>
        </span>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute right-3 top-3 flex max-w-[16rem] flex-col items-end gap-1.5 rounded-md border border-line-1 bg-ink-900/85 px-3 py-2 backdrop-blur-sm">
      <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
        {kinds.map((kind) => {
          const style = edgeStyle(kind);
          return (
            <span key={kind} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-px w-3.5"
                style={{
                  backgroundColor: style.dash ? "transparent" : style.stroke,
                  backgroundImage: style.dash
                    ? `repeating-linear-gradient(to right, ${style.stroke} 0 3px, transparent 3px 6px)`
                    : undefined,
                }}
              />
              <span className="ow-mono-micro text-text-lo">{style.label}</span>
            </span>
          );
        })}
      </div>
      {truncated && (
        <span className="ow-mono-micro text-warn">
          VIEW TRUNCATED — CLOSE SOMETHING OR NARROW THE FILTERS
        </span>
      )}
    </div>
  );
}
