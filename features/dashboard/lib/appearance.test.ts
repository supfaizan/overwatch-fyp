import { JOB_STATUS } from '@/shared/lib/job-status';
import { describe, expect, it } from 'vitest';
import type { GraphView, ViewNode } from '../types';
import { moduleTints } from './appearance';

const REPO = 'o/r';

const node = (id: string, label: ViewNode['label'], parent: string | null): ViewNode => {
  return {
    id,
    name: id,
    label,
    kind: null,
    path: null,
    depth: 0,
    file_count: 0,
    definition_count: 0,
    child_count: 0,
    language: null,
    parent_id: parent,
    expandable: false,
    expanded: false,
  };
};

const view = (nodes: ViewNode[]): GraphView => {
  return {
    repo_full_name: REPO,
    parse_status: JOB_STATUS.done,
    graph_version: null,
    nodes,
    edges: [],
    containment: [],
    overflows: [],
    expanded: [],
    truncated: false,
  };
};

describe('moduleTints', () => {
  const tops = [
    node(REPO, 'Repository', null),
    node(`${REPO}:web`, 'Module', REPO),
    node(`${REPO}:api`, 'Module', REPO),
    node(`${REPO}:__external__`, 'Module', REPO),
    node(`${REPO}:setup.py`, 'File', REPO),
  ];

  it('gives each top-level folder its own colour, shared by everything inside it', () => {
    const tintOf = moduleTints(view(tops));

    expect(tintOf(`${REPO}:api`)).not.toBe(tintOf(`${REPO}:web`));
    expect(tintOf(`${REPO}:api/v1/users.py#get`)).toBe(tintOf(`${REPO}:api`));
  });

  it("keeps a folder's colour as more of the repo is drawn", () => {
    const before = moduleTints(view(tops));
    const after = moduleTints(view([...tops, node(`${REPO}:web/ui`, 'Module', `${REPO}:web`)]));

    expect(after(`${REPO}:web`)).toBe(before(`${REPO}:web`));
  });

  it('leaves packages and top-level files out of the folder colours', () => {
    const tintOf = moduleTints(view(tops));

    expect(tintOf(`${REPO}:pkg:npm/react`)).toBe(tintOf(`${REPO}:setup.py`));
    expect(tintOf(`${REPO}:pkg:npm/react`)).not.toBe(tintOf(`${REPO}:api`));
  });
});
