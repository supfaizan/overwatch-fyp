/** The ids a repo's graph uses for things outside any directory (app/knowledge_graph/build/ids.py). */
const EXTERNAL_MODULE = '__external__';
const ROUTES_MODULE = '__routes__';

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
