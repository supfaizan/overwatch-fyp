import { stagePosition } from "../../lib/geometry";
import { getNode } from "../../static/system";
import type { NodeTag } from "../../types";

/** A small label pinned just below a node. */
export function GraphTag({ nodeId, label }: NodeTag) {
  const node = getNode(nodeId);

  return (
    <span
      className="absolute -translate-x-1/2 translate-y-5 whitespace-nowrap rounded-full border border-signal-border bg-ink-900/90 px-2 py-0.5 font-mono text-[9px] text-signal animate-in fade-in slide-in-from-top-1 duration-500 motion-reduce:animate-none sm:translate-y-6 sm:text-[10px]"
      style={stagePosition(node.x, node.y)}
    >
      {label}
    </span>
  );
}
