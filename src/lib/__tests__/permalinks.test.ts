import { describe, expect, it } from 'vitest';
import {
  encodeRepoPath,
  ghwebBlobPath,
  githubBlobUrl,
  lineHash,
  parseLineHash,
} from '../permalinks';

describe('permalinks', () => {
  it('builds line hashes', () => {
    expect(lineHash({ start: 3 })).toBe('#L3');
    expect(lineHash({ start: 3, end: 7 })).toBe('#L3-L7');
  });

  it('parses line hashes', () => {
    expect(parseLineHash('#L12')).toEqual({ start: 12, end: 12 });
    expect(parseLineHash('L1-L4')).toEqual({ start: 1, end: 4 });
    expect(parseLineHash('#nope')).toBeNull();
  });

  it('builds github and ghweb blob urls', () => {
    expect(githubBlobUrl('o', 'r', 'abc', 'src/a.ts', { start: 2 })).toBe(
      'https://github.com/o/r/blob/abc/src/a.ts#L2',
    );
    expect(ghwebBlobPath('o', 'r', 'abc', 'src/a.ts', { start: 2 })).toBe(
      '/o/r/blob/abc/src/a.ts#L2',
    );
    expect(encodeRepoPath('a/b c')).toBe('a/b%20c');
  });
});
