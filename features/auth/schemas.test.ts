import { describe, expect, it } from 'vitest';
import { resetPasswordSchema, signUpSchema, username } from './schemas';

const ACCOUNT = {
  name: 'Ada',
  username: 'ada',
  email: 'ada@example.com',
  password: 'correct horse',
};

describe('sign-up rules', () => {
  it('judges passwords by length alone', () => {
    expect(signUpSchema.safeParse({ ...ACCOUNT, password: '1234567' }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...ACCOUNT, password: '12345678' }).success).toBe(true);
    expect(signUpSchema.safeParse({ ...ACCOUNT, password: 'x'.repeat(129) }).success).toBe(false);
  });

  it('puts each problem on its own field', () => {
    const result = signUpSchema.safeParse({ ...ACCOUNT, email: 'nope', name: ' ' });
    const fields = result.success ? [] : result.error.issues.map((issue) => {
      return issue.path[0];
    });
    expect(fields.sort()).toEqual(['email', 'name']);
  });

  it('lowercases usernames and keeps to letters, digits and single separators', () => {
    expect(username.parse('Ada_L')).toBe('ada_l');
    for (const bad of ['ab', '-ada', 'ada-', 'a--b', 'a b', 'x'.repeat(31)]) {
      expect(username.safeParse(bad).success).toBe(false);
    }
  });

  it('asks for the new password twice', () => {
    const result = resetPasswordSchema.safeParse({ password: 'long enough', confirm: 'different' });
    expect(result.success ? null : result.error.issues[0]?.path).toEqual(['confirm']);
  });
});
