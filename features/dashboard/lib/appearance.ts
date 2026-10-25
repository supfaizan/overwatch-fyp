import type { EdgeType, GraphView, NodeLabel, ViewNode } from '../types';
import { EXTERNAL_MODULE, topModuleOf } from './ancestors';

type EdgeStyle = { stroke: string; dash?: string; label: string };

const line = 'var(--color-border-strong)';
const quiet = 'var(--color-muted)';
const primary = 'var(--color-primary)';
const warning = 'var(--color-warning-strong)';

const EDGE_STYLES: Record<EdgeType, EdgeStyle> = {
  IMPORTS: { stroke: line, label: 'imports' },
  CALLS: { stroke: primary, label: 'calls' },
  RENDERS: { stroke: quiet, label: 'renders' },
  EXTENDS: { stroke: quiet, dash: '5 4', label: 'extends' },
  IMPLEMENTS: { stroke: quiet, dash: '2 3', label: 'implements' },
  USES_PACKAGE: { stroke: 'var(--color-border-hover)', dash: '5 5', label: 'uses package' },
  HANDLES: { stroke: warning, label: 'handles' },
  REQUESTS: { stroke: warning, dash: '5 4', label: 'requests' },
  SENDS: { stroke: primary, dash: '2 4', label: 'sends message' },
  RECEIVES: { stroke: primary, dash: '6 3', label: 'handles message' },
};

export const edgeStyle = (type: EdgeType): EdgeStyle => {
  return EDGE_STYLES[type] ?? { stroke: line, label: 'relates to' };
};

/** With a node in focus, "what this uses" and "what uses this" are coloured apart. */
export const FOCUS_STROKE = { outgoing: primary, incoming: warning } as const;

/** A walkthrough's path between its steps. */
export const WALK_STROKE = primary;

/** Tree lines: drawn solidly, since the folder tree is what the view is for. */
export const TREE_STROKE = 'var(--color-border-hover)';

const MODULE_TINTS = [
  'var(--color-accent-blue)',
  'var(--color-accent-orange)',
  'var(--color-accent-purple)',
  'var(--color-accent-amber)',
  'var(--color-success)',
];

/**
 * A colour per top-level folder, so the web's regions read apart. Handed out in name order over the
 * repo's top-level folders, which are always drawn, so a folder keeps its colour as others open.
 */
export function moduleTints(view: GraphView): (nodeId: string) => string {
  const folders = view.nodes.filter((node) => {
    return node.label === 'Module' && node.parent_id === view.repo_full_name;
  }).map((node) => {
    return topModuleOf(node.id);
  }).filter((top) => {
    return top !== null && top !== EXTERNAL_MODULE;
  }).sort();
  return (nodeId) => {
    const top = topModuleOf(nodeId);
    if (top === null) {
      return primary;
    }
    const index = folders.indexOf(top);
    // packages, and files at the top level, belong to no folder
    return index === -1 ? quiet : MODULE_TINTS[index % MODULE_TINTS.length];
  };
}

/** What a node is, in one word. */
export function describeNode(label: NodeLabel, kind: string | null): string {
  if (label === 'Module') {
    if (kind === 'external') {
      return 'packages';
    }
    if (kind === 'routes') {
      return 'routes';
    }
    if (kind === 'channels') {
      return 'messages';
    }
    return 'folder';
  }
  if (label === 'Symbol') {
    return kind ?? 'definition';
  }
  if (label === 'Channel') {
    return kind ?? 'message';
  }
  return label.toLowerCase();
}

/** What opening a node would show; counts are subtree totals. */
export function describeContents(
  node: Pick<ViewNode, 'label' | 'file_count' | 'definition_count' | 'child_count'>,
): string {
  if (node.label === 'Module' && node.file_count > 0) {
    return `${node.file_count} ${node.file_count === 1 ? 'file' : 'files'}`;
  }
  if (node.label === 'File' && node.definition_count > 0) {
    return `${node.definition_count} defs`;
  }
  if (node.child_count > 0) {
    return `${node.child_count} inside`;
  }
  return '';
}
