import { describe, expect, it } from 'vitest';
import { fileProblem, formatBytes, MAX_FILE_BYTES } from './files';

describe('fileProblem', () => {
  it('takes allowed files up to the size limit, whatever the case of their extension', () => {
    expect(fileProblem('Plan.PDF', 1000)).toBeNull();
    expect(fileProblem('notes.md', MAX_FILE_BYTES)).toBeNull();
  });

  it('says why a file can’t be added', () => {
    expect(fileProblem('logo.svg', 10)).toMatch(/^logo\.svg can't be shared/);
    expect(fileProblem('README', 10)).toMatch(/^README can't be shared/);
    expect(fileProblem('big.pdf', MAX_FILE_BYTES + 1)).toBe('big.pdf is over 25 MB.');
  });
});

describe('formatBytes', () => {
  it('reads like people write sizes', () => {
    expect([820, 14_336, 3_355_443, 26_214_400].map(formatBytes)).toEqual([
      '820 B',
      '14 KB',
      '3.2 MB',
      '25 MB',
    ]);
  });
});
