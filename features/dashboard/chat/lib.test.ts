import { API_URL } from '@/shared/api/envelope';
import { describe, expect, it } from 'vitest';
import {
  answerBlocks,
  answerMarkdown,
  draftMarkdown,
  githubLineUrl,
  keptMentions,
  lineRange,
  mentionQuery,
  parseServerSent,
  questionSegments,
  safeImageSrc,
} from './lib';
import type { ChatMessage, CodeCitation, NodeRef } from './types';

const node = (name: string, ref: string | null = null): NodeRef => {
  return {
    ref,
    node_id: `r:${name}`,
    module_id: 'r:m',
    name,
  };
};
const message = (
  role: ChatMessage['role'],
  text: string,
  nodes: NodeRef[],
  citations: CodeCitation[] = [],
): ChatMessage => {
  return {
    id: '1',
    role,
    text,
    nodes,
    citations,
    steps: [],
    follow_ups: [],
    ask: null,
    grounded: true,
    created_at: '',
  };
};
const citation = (ref: string, start = 42, end = 58): CodeCitation => {
  return {
    ref,
    path: 'app/auth/service.py',
    commit_sha: 'a'.repeat(40),
    start_line: start,
    end_line: end,
    code: '',
    language: 'python',
    node_id: null,
  };
};

describe('answerMarkdown', () => {
  it("chips a step's text with the answer's own references", () => {
    const answer = message('assistant', 'Summary.', [node('login', 'n1'), node('verify', 'n2')], [
      citation('c1'),
    ]);

    expect(answerMarkdown(answer, 'hands off to verify [n2] [c1], not [n9]')).toBe(
      'hands off to `⟦n2⟧` `⟦c1⟧`, not',
    );
  });

  it('turns references into chips, taking the name written before them', () => {
    const login = node('login', 'n1');
    const verify = node('verify', 'n2');

    expect(
      answerMarkdown(
        message('assistant', '**login** [n1] calls `verify` [n2], see [n2].', [login, verify]),
      ),
    ).toBe(
      '`⟦n1⟧` calls `⟦n2⟧`, see `⟦n2⟧`.',
    );
  });

  it('drops a reference it has no node for and leaves code blocks alone', () => {
    const text = 'Use it here [n9].\n\n```js\nconst a = [n1];\n```';

    expect(answerMarkdown(message('assistant', text, [node('a', 'n1')]))).toBe(
      'Use it here.\n\n```js\nconst a = [n1];\n```',
    );
  });

  it('keeps markdown structure around chips', () => {
    expect(
      answerMarkdown(
        message('assistant', '- **Auth**: handled by verifyToken [n1]', [
          node('verifyToken', 'n1'),
        ]),
      ),
    ).toBe(
      '- **Auth**: handled by `⟦n1⟧`',
    );
  });
});

describe('questionSegments', () => {
  it('turns a question’s @-mentions into chips, longest name first', () => {
    const user = node('user');
    const userService = node('user_service');

    expect(questionSegments(message('user', 'does @user_service call @user?', [user, userService])))
      .toEqual([
        { type: 'text', text: 'does ' },
        { type: 'node', node: userService },
        { type: 'text', text: ' call ' },
        { type: 'node', node: user },
        { type: 'text', text: '?' },
      ]);
  });
});

describe('mentionQuery', () => {
  it('finds the @term at the caret', () => {
    expect(mentionQuery('what calls @handle_lo', 21)).toEqual({ term: 'handle_lo', start: 11 });
    expect(mentionQuery('@', 1)).toEqual({ term: '', start: 0 });
  });

  it('ignores an email-like @ and a finished mention', () => {
    expect(mentionQuery('mail a@b', 8)).toBeNull();
    expect(mentionQuery('@login and', 10)).toBeNull();
  });
});

describe('keptMentions', () => {
  it('keeps only the mentions still in the text, once each', () => {
    const login = { nodeId: 'r:login', name: 'login' };
    const auth = { nodeId: 'r:auth', name: 'auth' };

    expect(keptMentions('is @login used? @login', [login, auth, login])).toEqual([login]);
    expect(keptMentions('@login_v2', [login])).toEqual([]);
  });
});

describe('safeImageSrc', () => {
  const api = API_URL.replace(/\/$/, '');

  it('loads our attachments, relative or absolute, and inline raster data', () => {
    expect(safeImageSrc('/chat/attachments/a1.png')).toBe(`${api}/chat/attachments/a1.png`);
    expect(safeImageSrc(`${api}/chat/attachments/a1.png`)).toBe(`${api}/chat/attachments/a1.png`);
    expect(safeImageSrc('data:image/png;base64,iVBORw0KGgo=')).toBe(
      'data:image/png;base64,iVBORw0KGgo=',
    );
  });

  it('refuses other servers, other API paths, a climb out of attachments and svg data', () => {
    expect(safeImageSrc('https://attacker.example/p.png?d=secret')).toBeNull();
    expect(safeImageSrc(`${api}/auth/me`)).toBeNull();
    expect(safeImageSrc('/chat/attachments/../../auth/me')).toBeNull();
    expect(safeImageSrc('data:image/svg+xml;base64,PHN2Zz4=')).toBeNull();
    expect(safeImageSrc('javascript:alert(1)')).toBeNull();
    expect(safeImageSrc(undefined)).toBeNull();
  });
});

describe('code citations', () => {
  it('become chips where they are written, keeping the space before them', () => {
    expect(
      answerMarkdown(
        message('assistant', 'It rejects expired tokens [c1], then logs in[c2].', [], [
          citation('c1'),
          citation('c2'),
        ]),
      ),
    ).toBe('It rejects expired tokens `⟦c1⟧`, then logs in `⟦c2⟧`.');
  });

  it('are dropped when the message has no such citation, and left alone in code', () => {
    expect(
      answerMarkdown(
        message('assistant', 'See [c3].\n\n```py\nx = a[c1]\n```', [], [citation('c1')]),
      ),
    ).toBe('See.\n\n```py\nx = a[c1]\n```');
  });

  it('link to their lines on GitHub at the cited commit', () => {
    expect(githubLineUrl('acme/api', citation('c1'))).toBe(
      `https://github.com/acme/api/blob/${'a'.repeat(40)}/app/auth/service.py#L42-L58`,
    );
    expect(githubLineUrl('acme/api', { ...citation('c1', 7, 7), path: 'docs/a b.md' })).toBe(
      `https://github.com/acme/api/blob/${'a'.repeat(40)}/docs/a%20b.md#L7`,
    );
  });

  it('label one line or a range', () => {
    expect(lineRange(citation('c1', 7, 7))).toBe('7');
    expect(lineRange(citation('c1'))).toBe('42–58');
  });
});

describe('parseServerSent', () => {
  it('reads complete events and keeps a partial one for the next chunk', () => {
    const first = parseServerSent('event: started\ndata: {}\n\nevent: thinking\ndata: {"text":"Lo');
    expect(first.events).toEqual([{ event: 'started', data: {} }]);

    const second = parseServerSent(
      `${first.rest}oking"}\r\n\r\nevent: answer\ndata: {"text":"Hi"}\n\n`,
    );
    expect(second.events).toEqual([
      { event: 'thinking', data: { text: 'Looking' } },
      { event: 'answer', data: { text: 'Hi' } },
    ]);
    expect(second.rest).toBe('');
  });

  it('reads a lookup as a status event', () => {
    expect(parseServerSent('event: status\ndata: {"text":"Reading SignupForm"}\n\n').events)
      .toEqual([
        { event: 'status', data: { text: 'Reading SignupForm' } },
      ]);
  });

  it('skips an event whose data is not JSON', () => {
    expect(parseServerSent('event: answer\ndata: {oops\n\n').events).toEqual([]);
  });
});

describe('draftMarkdown', () => {
  it('leaves references and code citations out until the answer is checked', () => {
    expect(draftMarkdown('login [n4] rejects expired tokens [s3:42-58], see [s1:7].')).toBe(
      'login rejects expired tokens, see.',
    );
  });

  it('hides header lines a model wrote after the answer', () => {
    expect(draftMarkdown('It lives in api.\n\nRELATIONS: none')).toBe('It lives in api.\n\n');
  });

  it("hides the line a flow's steps start after", () => {
    expect(draftMarkdown('It flows.\n\n**Steps:**\n1. [n1] starts')).toBe(
      'It flows.\n\n\n1. starts',
    );
  });

  it('hides the follow-ups and a question back until the answer is checked', () => {
    expect(draftMarkdown('It works.\n\nFOLLOW_UPS:\n- And then?')).toBe('It works.\n\n');
    expect(draftMarkdown('Two match.\n\nASK: Which?\n- A\n- B')).toBe('Two match.\n\n');
  });

  it('hides a reference still being written at the end', () => {
    expect(draftMarkdown('It checks the user [s3:4')).toBe('It checks the user');
    expect(draftMarkdown('login [n')).toBe('login');
    expect(draftMarkdown('a list [')).toBe('a list');
    expect(draftMarkdown('mirroring it [ s3:1-21 ].')).toBe('mirroring it.');
    expect(draftMarkdown('two hosts【s1:7-13】【s1:14-18】. More【s2:')).toBe('two hosts. More');
  });
});

describe('answerBlocks', () => {
  it('cuts callouts out of the prose, without their quote marks', () => {
    expect(answerBlocks('Intro.\n\n> [!WARNING]\n> It skips `⟦n1⟧`.\n> Twice.\n\nAfter.')).toEqual([
      { type: 'markdown', text: 'Intro.' },
      { type: 'callout', kind: 'warning', text: 'It skips `⟦n1⟧`.\nTwice.' },
      { type: 'markdown', text: 'After.' },
    ]);
  });

  it('leaves plain quotes, unknown kinds and quotes inside code as Markdown', () => {
    const text = '> just a quote\n\n> [!DANGER]\n> no\n\n```\n> [!TIP]\n```';

    expect(answerBlocks(text)).toEqual([{ type: 'markdown', text }]);
  });
});
