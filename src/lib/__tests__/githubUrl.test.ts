import { describe, expect, it } from 'vitest';
import { githubUrlToAppPath } from '../githubUrl';

describe('githubUrlToAppPath', () => {
  it('maps github.com URLs', () => {
    expect(
      githubUrlToAppPath('https://github.com/lucasew/ghweb/issues/1'),
    ).toBe('/lucasew/ghweb/issues/1');
    expect(
      githubUrlToAppPath('https://github.com/o/r/pull/1/files'),
    ).toBe('/o/r/pull/1/files');
  });

  it('maps bare owner/repo', () => {
    expect(githubUrlToAppPath('lucasew/ghweb')).toBe('/lucasew/ghweb');
  });

  it('rejects non-github hosts', () => {
    expect(githubUrlToAppPath('https://gitlab.com/a/b')).toBeNull();
  });
});
