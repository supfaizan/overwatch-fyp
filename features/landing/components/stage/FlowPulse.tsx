import { cn } from "@/lib/utils";
import { stagePosition } from "../../lib/geometry";
import { getNode } from "../../static/system";
import type { NodeId } from "../../types";

interface FlowPulseProps {
  nodeId: NodeId;
  step: number;
}

/** The signal travelling between flow steps. It sits beneath the nodes, so it
 *  only shows while it is moving from one node to the next. */
export function FlowPulse({ nodeId, step }: FlowPulseProps) {
  const node = getNode(nodeId);

  return (
    <span
      className={cn(
        "absolute size-2.5 -translate-1/2 rounded-full bg-signal shadow-[0_0_14px_3px_var(--ow-signal)] motion-reduce:hidden",
        // Jump straight back to the first step instead of flying across the graph.
        step > 0 && "transition-[left,top] duration-700 ease-in-out",
      )}
      style={stagePosition(node.x, node.y)}
    />
  );
}
