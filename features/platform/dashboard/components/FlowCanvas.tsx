"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Map as MapIcon, Route } from "lucide-react";
import { FlowAreaNode, type FlowAreaFlowNode } from "../graph/components/FlowAreaNode";
import { FollowNode } from "../graph/components/FollowNode";
import {
  FlowStepActions,
  FlowStepNode,
  type FlowStepFlowNode,
} from "../graph/components/FlowStepNode";
import { FLOW_VIA_PHRASE, edgeStyle } from "../graph/lib/appearance";
import { layoutFlow, stepNodeId, type FlowLayout } from "../graph/lib/flow-layout";
import { useShowInMap } from "../hooks";
import { useDashboardStore } from "../stores/dashboard-store";
import type { FlowResult } from "../types";

const nodeTypes = { flowStep: FlowStepNode, flowArea: FlowAreaNode };

type FlowCanvasNode = FlowStepFlowNode | FlowAreaFlowNode;

const FIT_PADDING = 0.2;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 1.6;
/** Calls are the default, so their lines go unlabelled; every other hop —
 *  a request, a message, a handler — is named where it happens. */
const UNLABELLED_VIA = "CALLS";

/** A walkthrough drawn on its own: its steps, grouped by where they live,
 *  and nothing else from the repository. The map is untouched underneath. */
export function FlowCanvas({ flow }: { flow: FlowResult }) {
  const cursor = useDashboardStore((state) => state.flowCursor);
  const playing = useDashboardStore((state) => state.flowPlaying);
  const setFlowCursor = useDashboardStore((state) => state.setFlowCursor);
  const setFlowPlaying = useDashboardStore((state) => state.setFlowPlaying);
  const setCanvas = useDashboardStore((state) => state.setCanvas);
  const showInMap = useShowInMap();

  const layout = useMemo(() => layoutFlow(flow.steps), [flow]);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowCanvasNode>([]);
  useEffect(() => setNodes(toNodes(layout)), [layout, setNodes]);
  const edges = useMemo(() => toEdges(layout, cursor), [layout, cursor]);
  const actions = useMemo(() => ({ showInMap }), [showInMap]);

  return (
    <div className="relative h-full bg-ink-850">
      <FlowStepActions.Provider value={actions}>
        <ReactFlow<FlowCanvasNode, Edge>
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, node: Node) => {
            if (node.type !== "flowStep") return;
            setFlowPlaying(false);
            setFlowCursor((node as FlowStepFlowNode).data.index);
          }}
          // Looking around by hand stops the walkthrough steering the view.
          onMoveStart={(event) => {
            if (event && playing) setFlowPlaying(false);
          }}
          fitView
          fitViewOptions={{ padding: FIT_PADDING }}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          proOptions={{ hideAttribution: true }}
          colorMode="light"
        >
          <FitOnNewFlow layout={layout} />
          <FollowNode nodeId={stepNodeId(cursor)} following={playing} />
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--ow-line-1)" />
          <Controls
            showInteractive={false}
            className="!border-line-1 !bg-surface-1 [&_button]:!border-line-1 [&_button]:!bg-surface-1 [&_button:hover]:!bg-surface-2 [&_svg]:!fill-text-mid"
          />
        </ReactFlow>
      </FlowStepActions.Provider>

      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-md border border-line-1 bg-ink-900/85 px-2 py-1.5 backdrop-blur-sm">
        <Route className="size-3.5 text-signal" aria-hidden />
        <span className="ow-micro text-text-mid">
          FLOW VIEW · {flow.steps.length} {flow.steps.length === 1 ? "STEP" : "STEPS"}
        </span>
        <button
          type="button"
          onClick={() => setCanvas("map")}
          className="pointer-events-auto ml-1 flex items-center gap-1 rounded-sm border border-line-2 px-1.5 py-0.5 ow-micro text-text-lo transition-colors hover:border-signal-border hover:text-signal"
        >
          <MapIcon className="size-3" aria-hidden /> BACK TO MAP
        </button>
      </div>
    </div>
  );
}

/** Fits the whole flow once per new walkthrough, after its cards are
 *  measured. `fitView` on the canvas only covers the first one. */
function FitOnNewFlow({ layout }: { layout: FlowLayout }) {
  const { fitView } = useReactFlow();
  const measured = useNodesInitialized();
  const fitted = useRef<FlowLayout | null>(null);

  useEffect(() => {
    if (!measured || fitted.current === layout) return;
    fitted.current = layout;
    void fitView({ padding: FIT_PADDING, duration: 200 });
  }, [layout, measured, fitView]);

  return null;
}

function toNodes(layout: FlowLayout): FlowCanvasNode[] {
  // Areas first and beneath: frames behind the steps they hold.
  const areas: FlowAreaFlowNode[] = layout.areas.map((area) => ({
    id: area.id,
    type: "flowArea",
    position: area.position,
    data: { label: area.label, width: area.width, height: area.height },
    selectable: false,
    focusable: false,
    zIndex: -1,
  }));
  const steps: FlowStepFlowNode[] = layout.steps.map((step) => ({
    id: step.id,
    type: "flowStep",
    position: step.position,
    data: { step: step.step, index: step.index },
  }));
  return [...areas, ...steps];
}

function toEdges(layout: FlowLayout, cursor: number): Edge[] {
  return layout.links.map((link) => {
    const reached = link.targetIndex <= cursor;
    const active = link.targetIndex === cursor;
    const style = link.via ? edgeStyle(link.via) : null;
    const stroke = active ? "var(--ow-signal)" : (style?.stroke ?? "var(--ow-line-2)");
    const label = link.via && link.via !== UNLABELLED_VIA ? FLOW_VIA_PHRASE[link.via] : undefined;
    return {
      id: link.id,
      source: link.source,
      target: link.target,
      type: "smoothstep",
      animated: active,
      selectable: false,
      focusable: false,
      label,
      labelStyle: { fill: stroke, fontFamily: "var(--ow-font-mono)", fontSize: 9, letterSpacing: "0.08em" },
      labelBgStyle: { fill: "var(--ow-ink-900)" },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 3,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: stroke },
      style: {
        stroke,
        strokeWidth: active ? 2 : 1.5,
        strokeDasharray: style?.dash,
        opacity: reached ? 1 : 0.45,
      },
    };
  });
}
