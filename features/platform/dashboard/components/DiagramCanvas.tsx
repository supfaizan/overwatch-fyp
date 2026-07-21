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
import { Loader2 } from "lucide-react";
import { ServiceNode } from "./nodes/ServiceNode";
import { useGraph } from "../hooks";
import { useDashboardStore } from "../stores/dashboard-store";
import type { GraphEdge, GraphNodeData, ServiceNode as ServiceNodeT } from "../types";

const nodeTypes = { service: ServiceNode };

function styleEdges(edges: GraphEdge[], highlighted: string[]): Edge[] {
  const hi = new Set(highlighted);
  return edges.map((e) => {
    const probabilistic = e.data?.confidence === "probabilistic";
    const active = hi.size > 0 && hi.has(e.source) && hi.has(e.target);
    const dim = hi.size > 0 && !active;
    return {
      ...e,
      type: "default",
      animated: active || probabilistic,
      label: e.data?.note,
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
          : probabilistic
            ? "var(--ow-stale)"
            : "var(--ow-line-2)",
        strokeWidth: active ? 2 : 1.5,
        strokeDasharray: probabilistic ? "5 5" : undefined,
        opacity: dim ? 0.18 : 1,
      },
    };
  });
}

function riskHex(risk: number) {
  if (risk >= 0.7) return "#E5564F";
  if (risk >= 0.4) return "#F5A524";
  return "#4ADE80";
}

export function DiagramCanvas() {
  const { data, isLoading } = useGraph();
  const highlighted = useDashboardStore((s) => s.highlightedNodeIds);
  const selectNode = useDashboardStore((s) => s.selectNode);
  const setHighlighted = useDashboardStore((s) => s.setHighlighted);

  const [nodes, setNodes, onNodesChange] = useNodesState<ServiceNodeT>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Hydrate from the graph query.
  useEffect(() => {
    if (!data) return;
    setNodes(data.nodes);
    setEdges(styleEdges(data.edges, highlighted));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Restyle edges when the spotlight changes.
  useEffect(() => {
    if (!data) return;
    setEdges(styleEdges(data.edges, highlighted));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighted, data]);

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center bg-ink-850">
        <div className="flex items-center gap-2 ow-mono-micro text-text-dim">
          <Loader2 className="size-4 animate-spin text-signal" />
          RENDERING ARCHITECTURE GRAPH…
        </div>
      </div>
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
          nodeColor={(n) => riskHex((n.data as GraphNodeData)?.risk ?? 0)}
          nodeStrokeWidth={0}
        />
      </ReactFlow>

      {/* layer legend */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1 rounded-md border border-line-1 bg-ink-900/80 px-3 py-2 backdrop-blur-sm">
        <span className="ow-mono-micro text-text-dim">RISK HEATMAP · T-GNN</span>
        <div className="mt-1 flex items-center gap-3">
          {[
            { c: "bg-signal", l: "LOW" },
            { c: "bg-warn", l: "MED" },
            { c: "bg-critical", l: "HIGH" },
          ].map((x) => (
            <span key={x.l} className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${x.c}`} />
              <span className="ow-mono-micro text-text-lo">{x.l}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
