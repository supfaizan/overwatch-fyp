/* Landing-page domain types.

   The page tells its story through one sample system graph. Each chapter
   selects a SceneMode, and lib/scene.ts turns that mode into a Scene: a
   plain description of how every node and edge should look. Components only
   render a Scene, so they never need to know which chapter is showing. */

export type SceneMode =
  | "intro"
  | "map"
  | "ask"
  | "flow"
  | "tickets"
  | "contracts"
  | "live"
  | "complete";

export type NodeId =
  | "web"
  | "api"
  | "auth"
  | "billing"
  | "mailer"
  | "db"
  | "packages";

export type EdgeId = `${NodeId}->${NodeId}`;

export interface SystemNode {
  id: NodeId;
  kind: "module" | "external";
  /** Centre point in the stage's coordinate space (see STAGE_SIZE). */
  x: number;
  y: number;
  /** Rotation in degrees while the graph is still a hand-drawn sketch. */
  sketchTilt: number;
}

export interface SystemEdge {
  source: NodeId;
  target: NodeId;
}

export type NodeTone =
  | "sketch"
  | "idle"
  | "focus"
  | "current"
  | "dim"
  | "alert"
  | "changed"
  | "healthy";

export type EdgeTone = "hidden" | "idle" | "focus" | "dim" | "alert" | "healthy";

/** A small label pinned under a node, e.g. a ticket key. */
export interface NodeTag {
  nodeId: NodeId;
  label: string;
}

export interface Scene {
  nodes: Record<NodeId, NodeTone>;
  edges: Record<EdgeId, EdgeTone>;
  /** Show the hand-drawn "wiki diagram" edge layer. */
  sketch: boolean;
  tags: readonly NodeTag[];
  /** Node the flow-walkthrough signal is currently sitting on. */
  pulse: { nodeId: NodeId; step: number } | null;
}

export interface CallToAction {
  label: string;
  href: string;
}

export interface Chapter {
  mode: SceneMode;
  label: string;
  title: string;
  body: string;
}
