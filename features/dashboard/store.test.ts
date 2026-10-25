import { beforeEach, describe, expect, it } from 'vitest';
import { useViewStore } from './store';

const REPO = 'o/r';
const STEP = { nodeId: `${REPO}:src/a.ts#login`, ancestors: [`${REPO}:src`] };

describe('endWalk', () => {
  beforeEach(() => {
    useViewStore.getState().reset();
  });

  it("drops a step's focus that is still waiting for its folders", () => {
    const { startWalk, endWalk } = useViewStore.getState();
    startWalk([STEP, { ...STEP, nodeId: `${REPO}:src/b.ts` }], 10, 'answer-1');
    expect(useViewStore.getState().focusRequest?.follow).toBe(true);

    endWalk();

    expect(useViewStore.getState().focusRequest).toBeNull();
  });

  it("keeps a chat reference's focus that isn't the walkthrough's", () => {
    const { focus, endWalk } = useViewStore.getState();
    focus(STEP.nodeId, STEP.ancestors);

    endWalk();

    expect(useViewStore.getState().focusRequest).toEqual({
      nodeId: STEP.nodeId,
      ancestors: STEP.ancestors,
    });
  });
});
