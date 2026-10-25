'use client';

import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  getViewportForBounds,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  useStore,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Spinner from '@/shared/components/spinner';
import { isRunning, JOB_STATUS } from '@/shared/lib/job-status';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import { useGraphView } from '../hooks';
import { edgeStyle, FOCUS_STROKE, TREE_STROKE } from '../lib/appearance';
import { DIAGRAM, type Diagram, startsOf, toCanvas } from '../lib/canvas';
import { describeEdge, relationTo } from '../lib/edges';
import { emphasis, RECEDED } from '../lib/emphasis';
import { prefersReducedMotion } from '../lib/motion';
import { walkEdges, walkMarks, walkPath, walkStandIns } from '../lib/walkthrough';
import { useViewStore } from '../store';
import type { Canvas, CanvasNode, EdgeType, GraphView, RelationEdge } from '../types';
import NodeCard from './node-card';
import OverflowNode from './overflow-node';
import { NO_MARKS, WalkMarksContext } from './walk-badge';
import WalkPlayer from './walk-player';
import { WebRelation, WebStrand } from './web-edge';
import WebNode from './web-node';
import WebOverflow from './web-overflow';

const nodeTypes = {
  [DIAGRAM.tree]: { graphNode: NodeCard, overflow: OverflowNode },
  [DIAGRAM.graph]: { graphNode: WebNode, overflow: WebOverflow },
};
const edgeTypes = { strand: WebStrand, relation: WebRelation };

// past 1, a small graph would be blown up to fill the canvas
const FIT = { padding: 0.18, minZoom: 0.55, maxZoom: 1 };
/** a walkthrough step within this share of the view's half-size from its middle is left where it is */
const FOLLOW_MARGIN = 0.35;
/** the least zoom a walkthrough step is shown at, so its name and number can be read */
const FOLLOW_ZOOM = 0.9;
/** how long nodes take to glide to a new layout, and the viewport to follow them */
const GLIDE_MS = 320;
/** past this many boxes, skip the refit animation, draw only what's on screen and show the minimap */
const DENSE = 60;
/** relationships at rest are present but quiet, so the folder tree reads first; quieter in the web, where they cross more */
const AT_REST_OPACITY = { [DIAGRAM.tree]: 0.22, [DIAGRAM.graph]: 0.12 };

export default function DiagramCanvas({ repo, diagram }: { repo: string; diagram: Diagram }) {
  const { data: view, isPending, isError, error, refetch, isPlaceholderData } = useGraphView(repo);
  const hovered = useViewStore((state) => {
    return state.hovered;
  });
  const selected = useViewStore((state) => {
    return state.selected;
  });
  const highlighted = useViewStore((state) => {
    return state.highlighted;
  });
  const walk = useViewStore((state) => {
    return state.walk;
  });
  const { open, hover, select } = useViewStore.getState();
  const { resolvedTheme } = useTheme();

  const { getNodes } = useReactFlow<CanvasNode, Edge>();
  const drawnAs = useRef(diagram);
  const laidOut = useRef<Canvas | undefined>(undefined);
  const glide = useRef(0);
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // the web's last positions, so opening a folder grows it rather than reshuffling it
  const placed = useRef<Record<string, { x: number; y: number }>>({});
  const data = useMemo(() => {
    if (!view) {
      return undefined;
    }
    const canvas = toCanvas(view, diagram, placed.current);
    if (diagram === DIAGRAM.graph) {
      placed.current = Object.fromEntries(canvas.nodes.map((node) => {
        return [node.id, node.position];
      }));
    }
    return canvas;
  }, [view, diagram]);
  // what stands for each walkthrough step on this drawing, and what that lights
  const walked = useMemo(() => {
    if (!walk || !data) {
      return null;
    }
    const standIns = walkStandIns(
      walk.steps.map((step) => {
        return step.nodeId;
      }),
      new Set(data.nodes.map((node) => {
        return node.id;
      })),
      repo,
    );
    const drawnSet = (ids: (string | null)[]) => {
      return new Set(ids.filter((id): id is string => {
        return id !== null;
      }));
    };
    return {
      walked: drawnSet(standIns.slice(0, walk.cursor + 1)),
      upcoming: drawnSet(standIns.slice(walk.cursor + 1)),
      marks: walkMarks(standIns, walk.cursor),
      path: walkPath(standIns, walk.cursor),
    };
  }, [walk, data, repo]);
  const { focusId, opacityOf } = useMemo(() => {
    // a folder's parent and contents are its neighbours too, not only what it uses
    const links = [
      ...(data?.edges ?? []),
      ...(data?.view.containment ?? []).map((line) => {
        return { source: line.parent, target: line.child };
      }),
    ];
    return emphasis(links, { hovered, selected, highlighted, walk: walked }, repo);
  }, [data, hovered, selected, highlighted, walked, repo]);
  // which nodes are on screen, not how they look: restyling must not refit the viewport
  const signature = useMemo(() => {
    return `${diagram}:${
      (data?.nodes ?? []).map((node) => {
        return node.id;
      }).join('|')
    }`;
  }, [data, diagram]);
  const dense = (data?.nodes.length ?? 0) > DENSE;

  useEffect(() => {
    if (!data) {
      return;
    }
    // the same nodes in the other diagram sit elsewhere, so none of the old ones can be reused
    const relaid = drawnAs.current !== diagram;
    drawnAs.current = diagram;
    // a new layout of the same diagram: nodes glide there from where they were, new ones from their folder
    const moved = !relaid && laidOut.current !== undefined && laidOut.current !== data;
    laidOut.current = data;
    const starts = moved && !prefersReducedMotion()
      ? startsOf(getNodes(), data)
      : new Map<string, { x: number; y: number }>();
    setNodes((current) => {
      return restyleNodes(relaid ? [] : current, data.nodes, opacityOf).map((node) => {
        const start = starts.get(node.id);
        return start ? { ...node, position: start } : node;
      });
    });
    if (starts.size > 0) {
      cancelAnimationFrame(glide.current);
      const targets = new Map(data.nodes.map((node) => {
        return [node.id, node.position];
      }));
      const begun = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - begun) / GLIDE_MS);
        const eased = 1 - (1 - progress) ** 3;
        setNodes((current) => {
          return current.map((node) => {
            const from = starts.get(node.id);
            const to = targets.get(node.id);
            return from && to
              ? {
                ...node,
                position: {
                  x: from.x + (to.x - from.x) * eased,
                  y: from.y + (to.y - from.y) * eased,
                },
              }
              : node;
          });
        });
        if (progress < 1) {
          glide.current = requestAnimationFrame(step);
        }
      };
      glide.current = requestAnimationFrame(step);
    }
    // a walkthrough quiets every line off its path
    const relations = walkEdges(
      styleEdges(data.edges, focusId, walked ? RECEDED.edge : AT_REST_OPACITY[diagram]),
      walked?.path ?? [],
      !prefersReducedMotion(),
    );
    const web = diagram === DIAGRAM.graph;
    // quietest first, so lines in focus paint over the rest
    setEdges([
      ...treeEdges(data.view.containment, opacityOf).map((edge) => {
        return { ...edge, type: web ? 'strand' : undefined };
      }),
      ...[
        ...relations.filter((edge) => {
          return !edge.zIndex;
        }),
        ...relations.filter((edge) => {
          return edge.zIndex;
        }),
      ].map((edge) => {
        return { ...edge, type: web ? 'relation' : undefined };
      }),
    ]);
  }, [data, diagram, focusId, opacityOf, walked, getNodes, setNodes, setEdges]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(glide.current);
    };
  }, []);

  if (isPending) {
    return (
      <Notice>
        <Spinner className="size-5 text-muted" /> Drawing the architecture…
      </Notice>
    );
  }
  if (isError) {
    return (
      <Notice>
        <Banner
          type="error"
          action={
            <Button
              size="sm"
              onClick={() => {
                return refetch();
              }}
            >
              Retry
            </Button>
          }
        >
          {error.message}
        </Banner>
      </Notice>
    );
  }
  if (!data || view.nodes.length === 0) {
    const status = view.parse_status;
    if (status === JOB_STATUS.failed) {
      return (
        <Notice>
          <Banner
            type="error"
            action={
              <Button size="sm" asChild>
                <Link href="/settings/repositories">Repositories</Link>
              </Button>
            }
          >
            Indexing this repository failed. Retry it from Settings.
          </Banner>
        </Notice>
      );
    }
    const indexing = isRunning(status);
    return (
      <Notice>
        {indexing && <Spinner className="size-5 text-muted" />}
        {indexing
          ? 'Indexing the repository. The diagram appears when the first pass finishes.'
          : 'Nothing to draw at this level.'}
      </Notice>
    );
  }

  return (
    <div className="relative h-full">
      <WalkMarksContext value={walked?.marks ?? NO_MARKS}>
        <ReactFlow<CanvasNode, Edge>
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes[diagram]}
          edgeTypes={edgeTypes}
          onNodeClick={(_, node) => {
            return node.type === 'graphNode' && select(node.id);
          }}
          onNodeDoubleClick={(_, node) => {
            return node.type === 'graphNode' && node.data.expandable && !node.data.expanded
              && open(node.id);
          }}
          onNodeMouseEnter={(_, node) => {
            return hover(node.id);
          }}
          onNodeMouseLeave={() => {
            return hover(null);
          }}
          // a node that moved out from under the pointer (a folder opening) never hears it leave; this
          // also fires over nodes, which sit inside the pane, so only the bare pane counts
          onPaneMouseMove={(event) => {
            return event.target === event.currentTarget && hover(null);
          }}
          onPaneClick={() => {
            select(null);
            hover(null);
          }}
          nodesConnectable={false}
          fitView
          fitViewOptions={FIT}
          onlyRenderVisibleElements={dense}
          minZoom={0.2}
          maxZoom={1.6}
          colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
          proOptions={{ hideAttribution: true }}
        >
          <FitToContent signature={signature} nodes={data.nodes} dense={dense} />
          <FocusOnRequest
            view={data.view}
            nodes={data.nodes}
            ready={!isPlaceholderData}
            signature={signature}
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1}
            color="var(--color-border-strong)"
          />
          <Controls showInteractive={false} />
          {/* only worth the space once there's more graph than fits */}
          {dense && <MiniMap pannable zoomable nodeStrokeWidth={0} />}
        </ReactFlow>
      </WalkMarksContext>
      <EdgeLegend view={data.view} edges={data.edges} focused={focusId !== null} />
      {walk && <WalkPlayer repo={repo} />}
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted">
      {children}
    </div>
  );
}

/**
 * React Flow only fits on mount, and opening a folder can double the picture's width. Waits for the
 * new nodes to be measured, and fits once per set of nodes so it never yanks a viewport the user moved.
 * Fits where the nodes are headed, not where a glide has them now, moving alongside them.
 */
function FitToContent(
  { signature, nodes, dense }: { signature: string; nodes: CanvasNode[]; dense: boolean },
) {
  const { setViewport, getInternalNode } = useReactFlow();
  const measured = useNodesInitialized();
  const width = useStore((state) => {
    return state.width;
  });
  const height = useStore((state) => {
    return state.height;
  });
  const fitted = useRef<string | null>(null);

  useEffect(() => {
    if (!measured || !width || fitted.current === signature) {
      return;
    }
    fitted.current = signature;
    const box = { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity };
    for (const node of nodes) {
      const size = getInternalNode(node.id)?.measured;
      box.x = Math.min(box.x, node.position.x);
      box.y = Math.min(box.y, node.position.y);
      box.x2 = Math.max(box.x2, node.position.x + (size?.width ?? 0));
      box.y2 = Math.max(box.y2, node.position.y + (size?.height ?? 0));
    }
    const bounds = { x: box.x, y: box.y, width: box.x2 - box.x, height: box.y2 - box.y };
    void setViewport(
      getViewportForBounds(bounds, width, height, FIT.minZoom, FIT.maxZoom, FIT.padding),
      { duration: dense ? 0 : GLIDE_MS },
    );
  }, [signature, measured, width, height, nodes, dense, setViewport, getInternalNode]);

  return null;
}

/**
 * Settles a chat reference click: once the view with its folders open has landed, selects the node,
 * or the nearest folder holding it that could be drawn (a capped folder may not show it), and pans there.
 */
function FocusOnRequest(
  { view, nodes, ready, signature }: {
    view: GraphView;
    nodes: CanvasNode[];
    ready: boolean;
    signature: string;
  },
) {
  const request = useViewStore((state) => {
    return state.focusRequest;
  });
  const { fitView, getNode, getViewport, setCenter } = useReactFlow();
  const measured = useNodesInitialized();
  const width = useStore((state) => {
    return state.width;
  });
  const height = useStore((state) => {
    return state.height;
  });

  useEffect(() => {
    if (!request || !ready || !measured) {
      return;
    }
    const drawn = new Set(view.nodes.map((node) => {
      return node.id;
    }));
    const target = [request.nodeId, ...[...request.ancestors].reverse()].find((id) => {
      return drawn.has(id);
    })
      ?? null;
    // React Flow takes the new nodes an effect later; wait for this one to be there to pan to
    if (target && !getNode(target)) {
      return;
    }
    useViewStore.getState().settleFocus(target);
    if (!target) {
      return;
    }
    if (!request.follow) {
      void fitView({ nodes: [{ id: target }], padding: 0.6, maxZoom: 1.2, duration: 300 });
      return;
    }
    // a walkthrough step: pan only when it's off the middle of the view, or too small to read, so
    // stepping through doesn't swing the view about. Where it's headed, not where a glide has it now
    const position = nodes.find((node) => {
      return node.id === target;
    })?.position;
    const size = getNode(target)?.measured;
    if (!position) {
      return;
    }
    const centre = {
      x: position.x + (size?.width ?? 0) / 2,
      y: position.y + (size?.height ?? 0) / 2,
    };
    const { x, y, zoom } = getViewport();
    const onScreen = { x: centre.x * zoom + x, y: centre.y * zoom + y };
    const inView = Math.abs(onScreen.x - width / 2) < width * FOLLOW_MARGIN
      && Math.abs(onScreen.y - height / 2) < height * FOLLOW_MARGIN;
    if (!inView || zoom < FOLLOW_ZOOM) {
      void setCenter(centre.x, centre.y, {
        zoom: Math.max(zoom, FOLLOW_ZOOM),
        duration: prefersReducedMotion() ? 0 : 300,
      });
    }
  }, [
    request,
    ready,
    measured,
    view,
    nodes,
    signature,
    width,
    height,
    fitView,
    getNode,
    getViewport,
    setCenter,
  ]);

  return null;
}

/** Reuse every node whose look didn't change: React Flow re-measures any node handed over as a new object. */
function restyleNodes(
  current: CanvasNode[],
  next: CanvasNode[],
  opacityOf: (id: string) => number,
): CanvasNode[] {
  const previous = new Map(current.map((node) => {
    return [node.id, node];
  }));
  return next.map((node) => {
    const opacity = opacityOf(node.id);
    const prior = previous.get(node.id);
    if (!prior || prior.data !== node.data) {
      return { ...node, style: { opacity } };
    }
    return prior.style?.opacity === opacity
      ? prior
      : { ...prior, style: { ...prior.style, opacity } };
  });
}

function styleEdges(
  edges: RelationEdge[],
  focusId: string | null,
  restOpacity: number,
): Edge[] {
  return edges.map((edge) => {
    const detail = edge.data ?? { types: [], weight: 0, collapsed: false };
    const relation = relationTo(edge, focusId);
    const connected = relation === 'outgoing' || relation === 'incoming';
    const style = edgeStyle(detail.types[0]);
    const stroke = relation === 'outgoing'
      ? FOCUS_STROKE.outgoing
      : relation === 'incoming'
      ? FOCUS_STROKE.incoming
      : style.stroke;

    return {
      ...edge,
      zIndex: connected ? 1 : 0,
      // lines aren't clickable; React Flow's wide hit path would steal hover from the nodes beneath
      interactionWidth: 0,
      // only lines answering the current question are named
      label: connected ? describeEdge(detail) : undefined,
      labelStyle: { fill: stroke, fontSize: 10 },
      labelBgStyle: { fill: 'var(--color-surface)' },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 3,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: stroke },
      style: {
        stroke,
        strokeWidth: connected ? 2 : 1,
        strokeDasharray: style.dash,
        opacity: connected ? 1 : focusId ? RECEDED.edge : restOpacity,
        transition: 'opacity 140ms, stroke 140ms',
      },
    };
  });
}

/** A tree line recedes with either of its ends, so only the strands around what's in focus stay. */
function treeEdges(
  lines: GraphView['containment'],
  opacityOf: (id: string) => number,
): Edge[] {
  return lines.map((line) => {
    return {
      id: `${line.parent}>${line.child}`,
      source: line.parent,
      target: line.child,
      selectable: false,
      focusable: false,
      interactionWidth: 0,
      style: {
        stroke: TREE_STROKE,
        strokeWidth: 1.5,
        opacity: Math.min(opacityOf(line.parent), opacityOf(line.child)) < 1 ? RECEDED.edge : 1,
        transition: 'opacity 140ms',
      },
    };
  });
}

/** Explains only the lines on screen; with a node in focus, the focus colours instead. */
function EdgeLegend(
  { view, edges, focused }: { view: GraphView; edges: RelationEdge[]; focused: boolean },
) {
  const kinds = useMemo(
    () => {
      return [
        ...new Set(edges.flatMap((edge) => {
          return edge.data?.types ?? [];
        })),
      ].sort() as EdgeType[];
    },
    [edges],
  );
  if (kinds.length === 0 && !view.truncated) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute top-3 right-3 flex max-w-64 flex-col items-end gap-1.5 rounded-md border border-border bg-surface/90 px-3 py-2 text-xs text-muted backdrop-blur-sm">
      {focused
        ? (
          <>
            <LegendLine stroke={FOCUS_STROKE.outgoing}>this uses →</LegendLine>
            <LegendLine stroke={FOCUS_STROKE.incoming}>→ uses this</LegendLine>
          </>
        )
        : (
          <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
            {kinds.map((kind) => {
              const style = edgeStyle(kind);
              return (
                <LegendLine key={kind} stroke={style.stroke} dashed={Boolean(style.dash)}>
                  {style.label}
                </LegendLine>
              );
            })}
          </div>
        )}
      {view.truncated && (
        <span className="text-warning-strong">View truncated: close a folder to see the rest</span>
      )}
    </div>
  );
}

function LegendLine(
  { stroke, dashed, children }: { stroke: string; dashed?: boolean; children: ReactNode },
) {
  return (
    <span className="flex items-center gap-1.5">
      <svg aria-hidden width="14" height="2">
        <line
          x1="0"
          y1="1"
          x2="14"
          y2="1"
          stroke={stroke}
          strokeWidth="2"
          strokeDasharray={dashed ? '3 3' : undefined}
        />
      </svg>
      {children}
    </span>
  );
}
