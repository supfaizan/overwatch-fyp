import { describe, expect, it } from "vitest";
import { parseAnswer, tokenizeLine } from "./answer-text";

describe("tokenizeLine", () => {
  it("splits code, emphasis and citations out of prose, in order", () => {
    expect(tokenizeLine("Calls `findUserByEmail` [14] **first**.")).toEqual([
      { kind: "text", text: "Calls " },
      { kind: "code", text: "findUserByEmail" },
      { kind: "text", text: " " },
      { kind: "cite", number: 14 },
      { kind: "text", text: " " },
      { kind: "strong", text: "first" },
      { kind: "text", text: "." },
    ]);
  });

  it("leaves markup-looking text it does not handle as text, never as HTML", () => {
    expect(tokenizeLine("<script>alert(1)</script> [abc] `unclosed")).toEqual([
      { kind: "text", text: "<script>alert(1)</script> [abc] `unclosed" },
    ]);
  });

  it("keeps a plain line whole and an empty line empty", () => {
    expect(tokenizeLine("Just text")).toEqual([{ kind: "text", text: "Just text" }]);
    expect(tokenizeLine("")).toEqual([]);
  });
});

describe("parseAnswer", () => {
  it("keeps lines, so lists and paragraphs survive", () => {
    const [prose] = parseAnswer("Steps:\n1. `a` [1]\n\nDone.");
    expect(prose.kind === "prose" && prose.lines).toHaveLength(4);
    expect(prose.kind === "prose" && prose.lines[2]).toEqual([]);
  });

  it("splits quoted code out verbatim, markup and all", () => {
    const blocks = parseAnswer("It compares:\n```typescript\nconst ok = `x` [1] **y**;\n```\nThen [2].");
    expect(blocks.map((block) => block.kind)).toEqual(["prose", "code", "prose"]);
    expect(blocks[1]).toEqual({ kind: "code", language: "typescript", text: "const ok = `x` [1] **y**;" });
  });

  it("runs an unclosed fence to the end", () => {
    expect(parseAnswer("See:\n```\nline 1\nline 2")).toEqual([
      { kind: "prose", lines: [[{ kind: "text", text: "See:" }]] },
      { kind: "code", language: "", text: "line 1\nline 2" },
    ]);
  });

  it("treats indented fences, as in list items, as fences", () => {
    const blocks = parseAnswer("1. Step:\n   ```ts\n   a();\n   ```");
    expect(blocks.map((block) => block.kind)).toEqual(["prose", "code"]);
  });
});
