"use client";

import { useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2, GitBranch, TriangleAlert } from "lucide-react";
import { ServiceNode } from "./nodes/ServiceNode";
import { useGraph } from "../hooks";
import { useDashboardStore } from "../stores/dashboard-store";
import type { GraphEdge, GraphNodeData, ServiceNode as ServiceNodeT } from "../types";

const nodeTypes = { service: ServiceNode };

function styleEdges(
  edges: GraphEdge[],
  highlighted: string[],
  flowStepIds: string[],
): Edge[] {
  const hi = new Set(highlighted);
  // Consecutive pairs in the walkthrough — these get the travelling animation.
  const flowPairs = new Set(
    flowStepIds.slice(0, -1).map((id, i) => `${id}->${flowStepIds[i + 1]}`),
  );

  return edges.map((e) => {
    const external = e.data?.kind === "EXTERNAL_DEPENDENCY";
    const onFlow =
      flowPairs.has(`${e.source}->${e.target}`) ||
      flowPairs.has(`${e.target}->${e.source}`);
    const active = onFlow || (hi.size > 0 && hi.has(e.source) && hi.has(e.target));
    const dim = hi.size > 0 && !active;

    return {
      ...e,
      type: "default",
      animated: active,
      // Weight is the number of resolved imports collapsed into this edge.
      label: e.data && e.data.weight > 1 ? `×${e.data.weight}` : undefined,
      labelStyle: {
        fill: "var(--ow-stale)",
        fontFamily: "var(--ow-font-mono)",
        fontSize: 8,
        letterSpacing: "0.08em",
      },
      labelBgStyle: { fill: "var(--ow-ink-900)" },
      labelBgPadding: [4, 2] as [number, number],
      style: {
        stroke: active
          ? "var(--ow-signal)"
          : external
            ? "var(--ow-stale)"
            : "var(--ow-line-2)",
        strokeWidth: active ? 2 : 1.5,
        strokeDasharray: external ? "5 5" : undefined,
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
  const { data, isLoading, isError } = useGraph();
  const highlighted = useDashboardStore((s) => s.highlightedNodeIds);
  const flowStepIds = useDashboardStore((s) => s.flowStepIds);
  const selectNode = useDashboardStore((s) => s.selectNode);
  const setHighlighted = useDashboardStore((s) => s.setHighlighted);

  const [nodes, setNodes, onNodesChange] = useNodesState<ServiceNodeT>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Hydrate from the graph query.
  useEffect(() => {
    if (!data) return;
    setNodes(data.nodes);
    setEdges(styleEdges(data.edges, highlighted, flowStepIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Restyle edges when the spotlight or walkthrough changes.
  useEffect(() => {
    if (!data) return;
    setEdges(styleEdges(data.edges, highlighted, flowStepIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighted, flowStepIds, data]);

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
          : "NO GRAPH WAS PRODUCED FOR THIS REPOSITORY. THE PARSE MAY HAVE FAILED — CHECK THE REPOSITORIES SCREEN."}
      </CanvasNotice>
    );
  }

  return (
    <div className="relative h-full">
      <ReactFlow<ServiceNodeT, Edge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node: Node) => {
          selectNode(node.id);
          setHighlighted([node.id]);
        }}
        onPaneClick={() => {
          selectNode(null);
          setHighlighted([]);
        }}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.6}
        colorMode="dark"
      >
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
          nodeColor={(n) =>
            (n.data as GraphNodeData)?.kind === "external" ? "#6B7280" : "#4ADE80"
          }
          nodeStrokeWidth={0}
        />
      </ReactFlow>

      {/* legend — states the eval-1 grouping simplification openly */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1 rounded-md border border-line-1 bg-ink-900/80 px-3 py-2 backdrop-blur-sm">
        <span className="ow-mono-micro text-text-dim">
          ONE NODE PER TOP-LEVEL DIRECTORY
        </span>
        <div className="mt-1 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-signal" />
            <span className="ow-mono-micro text-text-lo">MODULE</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-stale" />
            <span className="ow-mono-micro text-text-lo">EXTERNAL</span>
          </span>
        </div>
      </div>
    </div>
  );
}
