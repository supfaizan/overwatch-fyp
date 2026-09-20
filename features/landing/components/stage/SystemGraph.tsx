import { cn } from "@/lib/utils";
import { sketchPath } from "../../lib/geometry";
import {
  EDGES,
  NODES,
  SKETCH_EDGES,
  STAGE_SIZE,
  edgeId,
  getNode,
} from "../../static/system";
import type { Scene } from "../../types";
import { FlowPulse } from "./FlowPulse";
import { GraphEdge } from "./GraphEdge";
import { GraphNode } from "./GraphNode";
import { GraphTag } from "./GraphTag";

const { width, height } = STAGE_SIZE;

/** Renders the sample system exactly as the scene describes it. Layer order:
 *  backdrop, edges, flow pulse, nodes, tags. */
export function SystemGraph({ scene }: { scene: Scene }) {
  return (
    <div
      className="relative mx-auto w-full max-w-xl"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <div className="pointer-events-none absolute -inset-10 bg-[radial-gradient(var(--ow-line-1)_1px,transparent_1px)] bg-size-[24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_72%)]" />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 size-full overflow-visible"
        fill="none"
      >
        <g
          className={cn(
            "transition-opacity duration-700",
            scene.sketch ? "opacity-100" : "opacity-0",
          )}
        >
          {SKETCH_EDGES.map((edge) => (
            <path
              key={edgeId(edge)}
              d={sketchPath(getNode(edge.source), getNode(edge.target))}
              stroke="var(--ow-text-dim)"
              strokeWidth={1.25}
              strokeDasharray="5 6"
              strokeLinecap="round"
            />
          ))}
        </g>

        {EDGES.map((edge, order) => (
          <GraphEdge
            key={edgeId(edge)}
            edge={edge}
            order={order}
            tone={scene.edges[edgeId(edge)]}
          />
        ))}
      </svg>

      {scene.pulse && <FlowPulse {...scene.pulse} />}

      {NODES.map((node) => (
        <GraphNode key={node.id} node={node} tone={scene.nodes[node.id]} />
      ))}

      {scene.tags.map((tag) => (
        <GraphTag key={`${tag.nodeId}:${tag.label}`} {...tag} />
      ))}
    </div>
  );
}
