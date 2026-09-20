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
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2, GitBranch, TriangleAlert } from "lucide-react";
import { GraphNodeCard } from "../graph/components/GraphNodeCard";
import { ViewControls } from "../graph/components/ViewControls";
import { useGraphView } from "../graph/hooks";
import { edgeStyle, spotlight } from "../graph/lib/appearance";
import { useViewStore } from "../graph/stores/view-store";
import type {
  ViewEdgeType,
  ViewFlowEdge,
  ViewFlowNode,
} from "../graph/types";
import { useDashboardStore } from "../stores/dashboard-store";

const nodeTypes = { graphNode: GraphNodeCard };

const FIT_PADDING = 0.22;

/** Refits the viewport whenever the set of nodes changes.
 *
 * Opening a folder can double the width of the picture, and React Flow only
 * fits on mount — without this, half the graph lands off-screen. It waits for
 * the new nodes to be measured, or it would fit to stale sizes. Rendered
 * inside `<ReactFlow>`, which is what puts it in the flow's context. */
function FitToContent({ signature }: { signature: string }) {
  const { fitView } = useReactFlow();
  const measured = useNodesInitialized();

  useEffect(() => {
    if (measured) void fitView({ padding: FIT_PADDING, duration: 220 });
  }, [signature, measured, fitView]);

  return null;
}

function styleEdges(
  edges: ViewFlowEdge[],
  lit: Set<string>,
  flowStepIds: string[],
): Edge[] {
  // Consecutive pairs in the walkthrough — these get the travelling animation.
  const flowPairs = new Set(
    flowStepIds.slice(0, -1).map((id, index) => `${id}->${flowStepIds[index + 1]}`),
  );

  return edges.map((edge) => {
    const style = edgeStyle(edge.data?.kind ?? "IMPORTS");
    const onFlow =
      flowPairs.has(`${edge.source}->${edge.target}`) ||
      flowPairs.has(`${edge.target}->${edge.source}`);
    const active = onFlow || (lit.size > 0 && lit.has(edge.source) && lit.has(edge.target));
    const dim = lit.size > 0 && !active;
    const weight = edge.data?.weight ?? 1;

    return {
      ...edge,
      type: "default",
      animated: active,
      // Weight is how many underlying relationships this one line stands for.
      label: weight > 1 ? `×${weight}` : undefined,
      labelStyle: {
        fill: "var(--ow-stale)",
        fontFamily: "var(--ow-font-mono)",
        fontSize: 8,
        letterSpacing: "0.08em",
      },
      labelBgStyle: { fill: "var(--ow-ink-900)" },
      labelBgPadding: [4, 2] as [number, number],
      style: {
        stroke: active ? "var(--ow-signal)" : style.stroke,
        strokeWidth: active ? 2 : 1.5,
        strokeDasharray: style.dash,
        opacity: dim ? 0.18 : 1,
      },
    };
  });
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
  const open = useViewStore((state) => state.open);

  const [nodes, setNodes, onNodesChange] = useNodesState<ViewFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // A chat answer names modules. Once a module is opened it is no longer on
  // the canvas, so its children carry the spotlight in its place.
  const lit = useMemo(
    () => spotlight((data?.nodes ?? []).map((node) => node.id), highlighted),
    [data, highlighted],
  );

  // Identifies *which* nodes are on screen, not how they look, so restyling
  // for a chat answer does not yank the viewport around.
  const signature = useMemo(
    () => (data?.nodes ?? []).map((node) => node.id).join("|"),
    [data],
  );

  useEffect(() => {
    if (!data) return;
    setNodes(data.nodes);
    setEdges(styleEdges(data.edges, lit, flowStepIds));
  }, [data, lit, flowStepIds, setNodes, setEdges]);

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
      <ReactFlow<ViewFlowNode, Edge>
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
          if ((node as ViewFlowNode).data?.expandable) open(node.id);
        }}
        onPaneClick={() => {
          selectNode(null);
          setHighlighted([]);
        }}
        fitView
        fitViewOptions={{ padding: FIT_PADDING }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={1.6}
        colorMode="dark"
      >
        <FitToContent signature={signature} />
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
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(7,9,13,0.7)"
          className="!bg-ink-900 !border !border-line-1"
          nodeColor={(node) =>
            (node.data as ViewFlowNode["data"])?.kind === "external"
              ? "#6B7280"
              : "#4ADE80"
          }
          nodeStrokeWidth={0}
        />
      </ReactFlow>

      <ViewControls expanded={data.expanded} />
      <EdgeLegend edges={data.edges} truncated={data.truncated} />
    </div>
  );
}

/** Only the relationships actually on screen, so the legend never explains
 *  a line the canvas is not drawing. */
function EdgeLegend({
  edges,
  truncated,
}: {
  edges: ViewFlowEdge[];
  truncated: boolean;
}) {
  const kinds = useMemo(() => {
    const seen = new Set<ViewEdgeType>();
    for (const edge of edges) if (edge.data) seen.add(edge.data.kind);
    return [...seen].sort();
  }, [edges]);

  if (kinds.length === 0 && !truncated) return null;

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
