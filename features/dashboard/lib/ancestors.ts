/** The ids a repo's graph uses for things outside any directory (app/knowledge_graph/build/ids.py). */
export const EXTERNAL_MODULE = '__external__';
export const ROUTES_MODULE = '__routes__';

/**
 * The folders (and classes) that hold a node, outermost first: what to open for it to be drawn.
 * Ids are path-derived (`repo:api/users.py#UserService.get@2`), so this needs no request.
 */
export function ancestorsOf(nodeId: string, repo: string): string[] {
  const prefix = `${repo}:`;
  if (!nodeId.startsWith(prefix)) {
    return [];
  }
  const rest = nodeId.slice(prefix.length);
  if (rest.startsWith('pkg:')) {
    return [prefix + EXTERNAL_MODULE];
  }
  if (rest.startsWith('route:')) {
    return [prefix + ROUTES_MODULE];
  }

  const [path, symbol] = rest.split('#', 2);
  const parts = path.split('/');
  const folders = parts.slice(0, -1).map((_, index) => {
    return prefix + parts.slice(0, index + 1).join('/');
  });
  if (symbol === undefined) {
    return folders;
  }

  // `UserService.get@2` sits in the file, inside `UserService`
  const owners = symbol.replace(/@\d+$/, '').split('.').slice(0, -1);
  const classes = owners.map((_, index) => {
    return `${prefix}${path}#${owners.slice(0, index + 1).join('.')}`;
  });
  return [...folders, prefix + path, ...classes];
}

/** The top-level module a node is in (itself, if it is one); null for the repository. */
export function topModuleOf(nodeId: string): string | null {
  // a repo's full name holds no `:`, so the first one ends it
  const at = nodeId.indexOf(':');
  if (at === -1) {
    return null;
  }
  const rest = nodeId.slice(at + 1);
  if (rest.startsWith('pkg:')) {
    return EXTERNAL_MODULE;
  }
  if (rest.startsWith('route:')) {
    return ROUTES_MODULE;
  }
  return rest.split(/[/#]/, 1)[0];
}
