import { cn } from "@/lib/utils";
import { stagePosition } from "../../lib/geometry";
import type { NodeTone, SystemNode } from "../../types";

const TONE_CLASS: Record<NodeTone, string> = {
  sketch: "border-dashed border-text-dim bg-transparent text-text-lo",
  idle: "border-line-2 bg-surface-1 text-text-hi",
  focus: "border-signal-border bg-surface-1 text-text-hi",
  current:
    "border-signal bg-surface-2 text-text-hi shadow-[0_0_0_4px_var(--ow-signal-soft),0_0_28px_var(--ow-signal-soft)]",
  dim: "border-line-1 bg-ink-850 text-text-dim",
  alert:
    "border-critical-border bg-surface-1 text-text-hi shadow-[0_0_0_4px_var(--ow-critical-soft)]",
  changed: "border-signal bg-surface-1 text-text-hi",
  healthy: "border-signal-border bg-surface-1 text-text-hi",
};

const DOT_CLASS: Record<NodeTone, string> = {
  sketch: "bg-transparent",
  idle: "bg-line-2",
  focus: "bg-signal",
  current: "bg-signal",
  dim: "bg-line-1",
  alert: "bg-critical",
  changed: "bg-signal",
  healthy: "bg-signal",
};

interface GraphNodeProps {
  node: SystemNode;
  tone: NodeTone;
}

export function GraphNode({ node, tone }: GraphNodeProps) {
  const sketch = tone === "sketch";
  const tilt = sketch ? node.sketchTilt : 0;
  const scale = tone === "current" ? 1.08 : 1;

  return (
    <div
      className="absolute -translate-1/2"
      style={stagePosition(node.x, node.y)}
    >
      {tone === "changed" && (
        <span className="absolute inset-0 animate-ping rounded-md border border-signal motion-reduce:hidden" />
      )}
      <div
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 font-mono text-[10px] sm:px-2.5 sm:py-1.5 sm:text-[11px]",
          "transition-[transform,border-color,background-color,color,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          node.kind === "external" && !sketch && "border-dashed",
          TONE_CLASS[tone],
        )}
        style={{ transform: `rotate(${tilt}deg) scale(${scale})` }}
      >
        <span
          className={cn(
            "size-1.5 rounded-full transition-colors duration-500",
            DOT_CLASS[tone],
          )}
        />
        {node.id}
      </div>
    </div>
  );
}
