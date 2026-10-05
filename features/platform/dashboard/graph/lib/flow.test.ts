import { describe, expect, it } from "vitest";
import {
  containersToOpen,
  flowMarks,
  flowMoves,
  projectSteps,
  unlinkedMoves,
  type ProjectableStep,
} from "./flow";
import type { CanvasNode, ViewFlowEdge, ViewNodeLabel } from "../types";

const ROOT = "o/r";
const API = "o/r:api";
const ROUTES_DIR = "o/r:api/routes";
const USERS = "o/r:api/routes/users.py";
const GET = "o/r:api/routes/users.py#get";

function box(id: string, label: ViewNodeLabel, expanded = false): CanvasNode {
  return {
    id,
    type: "graphNode",
    position: { x: 0, y: 0 },
    data: {
      label: id,
      nodeLabel: label,
      kind: null,
      path: null,
      fileCount: 0,
      definitionCount: 0,
      childCount: 0,
      parentId: null,
      expandable: true,
      expanded,
    },
  };
}

function overflow(id: string, containerId: string): CanvasNode {
  return {
    id,
    type: "overflow",
    position: { x: 0, y: 0 },
    data: { containerId, containerName: containerId, shown: 1, hidden: 5 },
  };
}

const getStep: ProjectableStep = { nodeId: GET, containers: [API, ROUTES_DIR, USERS] };

describe("projectSteps", () => {
  it("uses the step itself when it is drawn", () => {
    const nodes = [box(ROOT, "Repository", true), box(GET, "Symbol")];
    expect(projectSteps([getStep], nodes)).toEqual([GET]);
  });

  it("falls back to the deepest drawn container while it is shut", () => {
    const nodes = [box(ROOT, "Repository", true), box(API, "Module", true), box(ROUTES_DIR, "Module")];
    expect(projectSteps([getStep], nodes)).toEqual([ROUTES_DIR]);
  });

  it("lands on the overflow marker when its open container pages it out", () => {
    const nodes = [box(ROOT, "Repository", true), box(API, "Module", true), overflow("more", API)];
    expect(projectSteps([getStep], nodes)).toEqual(["more"]);
  });

  it("uses the root when nothing else holding the step is drawn", () => {
    const nodes = [box(ROOT, "Repository")];
    expect(projectSteps([getStep], nodes)).toEqual([ROOT]);
  });

  it("is null where nothing stands for the step", () => {
    expect(projectSteps([getStep], [])).toEqual([null]);
  });
});

describe("flowMarks", () => {
  it("numbers each box with every step it stands for, and flags the active one", () => {
    expect(flowMarks(["a", "b", "b", null], 2)).toEqual({
      a: { steps: [1], active: false },
      b: { steps: [2, 3], active: true },
    });
  });
});

describe("flowMoves", () => {
  it("draws a chain step to step, skipping shared boxes and missing ones", () => {
    // The hidden step is passed through, not a break in the line.
    expect(flowMoves(["a", "a", null, "b", "c"], [null, 0, 1, 2, 3])).toEqual([
      ["a", "b"],
      ["b", "c"],
    ]);
    expect(flowMoves(["a", "b", "c"], [null, 0, 1])).toEqual([
      ["a", "b"],
      ["b", "c"],
    ]);
  });

  it("draws a tree from each caller, never from the previous sibling's branch", () => {
    // login -> validate, login -> find -> query, login -> issue
    const projected = ["login", "validate", "find", "query", "issue"];
    const parents = [null, 0, 0, 2, 0];
    expect(flowMoves(projected, parents)).toEqual([
      ["login", "validate"],
      ["login", "find"],
      ["find", "query"],
      ["login", "issue"],
    ]);
  });

  it("draws a repeated move once", () => {
    expect(flowMoves(["a", "b", "b"], [null, 0, 0])).toEqual([["a", "b"]]);
  });
});

describe("unlinkedMoves", () => {
  it("keeps only moves with no drawn relationship, in either direction", () => {
    const edges = [{ id: "e", source: "b", target: "a" }] as ViewFlowEdge[];
    expect(unlinkedMoves([["a", "b"], ["b", "c"]], edges)).toEqual([["b", "c"]]);
  });
});

describe("containersToOpen", () => {
  it("lists containers once, parents before children, within the limit", () => {
    const other: ProjectableStep = { nodeId: "o/r:db/x.py#q", containers: ["o/r:db", "o/r:db/x.py"] };
    expect(containersToOpen([getStep, getStep, other], 4)).toEqual([API, ROUTES_DIR, USERS, "o/r:db"]);
  });
});
