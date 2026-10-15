import { API_URL } from '@/shared/api/envelope';
import { describe, expect, it } from 'vitest';
import { answerMarkdown, keptMentions, mentionQuery, questionSegments, safeImageSrc } from './lib';
import type { ChatMessage, NodeRef } from './types';

const node = (name: string, ref: string | null = null): NodeRef => {
  return {
    ref,
    node_id: `r:${name}`,
    module_id: 'r:m',
    name,
  };
};
const message = (role: ChatMessage['role'], text: string, nodes: NodeRef[]): ChatMessage => {
  return {
    id: '1',
    role,
    text,
    nodes,
    grounded: true,
    created_at: '',
  };
};

describe('answerMarkdown', () => {
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
