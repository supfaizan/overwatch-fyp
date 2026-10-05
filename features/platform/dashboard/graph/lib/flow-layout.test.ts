import { describe, expect, it } from "vitest";
import { flowArea, flowLinks, layoutFlow, STEP_HEIGHT, STEP_WIDTH } from "./flow-layout";
import type { FlowStep } from "../../types";

function step(name: string, path: string | null, parent: number | null, via: FlowStep["via"] = "CALLS"): FlowStep {
  return {
    nodeId: `r:${path ?? name}#${name}`,
    name,
    label: path ? "Symbol" : "Channel",
    kind: path ? "method" : "message",
    path,
    via: parent === null ? null : via,
    containers: [],
    parent,
    depth: 0,
    unresolved: [],
  };
}

// The glo-backend login: gateway -> message -> auth service, branching.
const LOGIN: FlowStep[] = [
  step("POST /api/auth/login", "apps/gateway/src/auth/auth-proxy.controller.ts", null),
  step("login", "apps/gateway/src/auth/auth-proxy.controller.ts", 0, "HANDLES"),
  step("auth.login", null, 1, "SENDS"),
  step("login", "apps/auth/src/auth/auth.controller.ts", 2, "RECEIVES"),
  step("login", "apps/auth/src/auth/auth.service.ts", 3),
  step("findUserByEmail", "apps/auth/src/auth/auth.service.ts", 4),
  step("generateTokenPair", "apps/auth/src/auth/auth.service.ts", 4),
];

describe("flowArea", () => {
  it("groups a monorepo by service, whatever folder is below it", () => {
    expect(flowArea({ path: "apps/auth/src/auth/auth.service.ts" })).toBe("apps/auth");
    expect(flowArea({ path: "libs/common/src/base.ts" })).toBe("libs/common");
  });

  it("groups a single app by the file's folder, and top-level files at the root", () => {
    expect(flowArea({ path: "src/app/routes/auth/auth.service.ts" })).toBe("src/app/routes/auth");
    expect(flowArea({ path: "main.py" })).toBe("(root)");
  });

  it("leaves steps with no file, like message channels, outside any area", () => {
    expect(flowArea({ path: null })).toBeNull();
  });
});

describe("flowLinks", () => {
  it("links each step from the step that led to it, never across siblings", () => {
    const links = flowLinks(LOGIN).map((link) => [link.source, link.target, link.via]);
    expect(links).toContainEqual(["flow-step-4", "flow-step-5", "CALLS"]);
    expect(links).toContainEqual(["flow-step-4", "flow-step-6", "CALLS"]);
    expect(links).not.toContainEqual(["flow-step-5", "flow-step-6", "CALLS"]);
    expect(links).toHaveLength(LOGIN.length - 1);
  });

  it("ignores a parent outside the flow rather than inventing a link", () => {
    expect(flowLinks([step("a", "a.ts", 7)])).toEqual([]);
  });
});

describe("layoutFlow", () => {
  const layout = layoutFlow(LOGIN);

  it("draws one box per area and every step once", () => {
    expect(layout.areas.map((area) => area.label).sort()).toEqual(["apps/auth", "apps/gateway"]);
    expect(layout.steps).toHaveLength(LOGIN.length);
  });

  it("puts each step inside its area's box and the channel in neither", () => {
    const box = (label: string) => layout.areas.find((area) => area.label === label)!;
    const inside = (index: number, label: string) => {
      const { x, y } = layout.steps[index].position;
      const area = box(label);
      return (
        x >= area.position.x && x + STEP_WIDTH <= area.position.x + area.width &&
        y >= area.position.y && y + STEP_HEIGHT <= area.position.y + area.height
      );
    };
    expect(inside(1, "apps/gateway")).toBe(true);
    expect(inside(5, "apps/auth")).toBe(true);
    expect(inside(2, "apps/gateway") || inside(2, "apps/auth")).toBe(false);
  });

  it("never overlaps two steps", () => {
    const positions = layout.steps.map((s) => s.position);
    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        const apart =
          Math.abs(positions[i].x - positions[j].x) >= STEP_WIDTH ||
          Math.abs(positions[i].y - positions[j].y) >= STEP_HEIGHT;
        expect(apart).toBe(true);
      }
    }
  });

  it("lays out a single step and an empty flow", () => {
    expect(layoutFlow([step("solo", "a.ts", null)]).steps).toHaveLength(1);
    expect(layoutFlow([])).toEqual({ steps: [], areas: [], links: [] });
  });
});
