import { describe, expect, it } from 'vitest';
import { ancestorsOf, EXTERNAL_MODULE, topModuleOf } from './ancestors';

const REPO = 'octocat/hello';

describe('ancestorsOf', () => {
  it('lists the folders, file and classes holding a symbol, outermost first', () => {
    expect(ancestorsOf(`${REPO}:api/v1/users.py#UserService.get@2`, REPO)).toEqual([
      `${REPO}:api`,
      `${REPO}:api/v1`,
      `${REPO}:api/v1/users.py`,
      `${REPO}:api/v1/users.py#UserService`,
    ]);
  });

  it('gives a top-level folder nothing to open', () => {
    expect(ancestorsOf(`${REPO}:api`, REPO)).toEqual([]);
    expect(ancestorsOf(`${REPO}:main.py#run`, REPO)).toEqual([`${REPO}:main.py`]);
  });

  it('puts packages and routes under their own modules', () => {
    expect(ancestorsOf(`${REPO}:pkg:npm/react`, REPO)).toEqual([`${REPO}:__external__`]);
    expect(ancestorsOf(`${REPO}:route:GET /users/*`, REPO)).toEqual([`${REPO}:__routes__`]);
  });

  it('ignores another repo’s ids', () => {
    expect(ancestorsOf('someone/else:api/x.py', REPO)).toEqual([]);
  });
});

describe('topModuleOf', () => {
  it('names the top-level folder a node is in, or itself', () => {
    expect(topModuleOf(`${REPO}:api/v1/users.py#UserService.get@2`)).toBe('api');
    expect(topModuleOf(`${REPO}:api`)).toBe('api');
    expect(topModuleOf(`${REPO}:main.py#run`)).toBe('main.py');
  });

  it('puts packages in the external module and gives the repository none', () => {
    expect(topModuleOf(`${REPO}:pkg:npm/@scope/name`)).toBe(EXTERNAL_MODULE);
    expect(topModuleOf(REPO)).toBeNull();
  });
});
