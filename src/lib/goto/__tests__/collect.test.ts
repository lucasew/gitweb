import { describe, expect, it } from 'vitest';
import { collectGotoCandidates } from '../collect';
import type { GotoContext } from '../types';

function ctx(partial: Partial<GotoContext> = {}): GotoContext {
  return {
    pathname: '/',
    repo: null,
    code: null,
    recent: [],
    ...partial,
  };
}

describe('collectGotoCandidates', () => {
  it('offers path open from code cwd', () => {
    const items = collectGotoCandidates('../x.ts', ctx({
      pathname: '/o/r/blob/main/src/lib/a.ts',
      repo: { owner: 'o', name: 'r' },
      code: {
        owner: 'o',
        name: 'r',
        refName: 'main',
        mode: 'blob',
        path: 'src/lib/a.ts',
        cwd: 'src/lib',
      },
    }));
    const path = items.find((i) => i.id === 'path');
    expect(path).toBeTruthy();
    expect(path!.action).toEqual({
      kind: 'open-repo-path',
      owner: 'o',
      name: 'r',
      ref: 'main',
      path: 'src/x.ts',
    });
  });

  it('offers folder from tree root', () => {
    const items = collectGotoCandidates('src', ctx({
      pathname: '/o/r/tree/main',
      repo: { owner: 'o', name: 'r' },
      code: {
        owner: 'o',
        name: 'r',
        refName: 'main',
        mode: 'tree',
        path: '',
        cwd: '',
      },
    }));
    const path = items.find((i) => i.id === 'path');
    expect(path?.action).toMatchObject({
      kind: 'open-repo-path',
      path: 'src',
    });
  });

  it('offers slash sections for current repo', () => {
    const items = collectGotoCandidates('/issues', ctx({
      pathname: '/o/r',
      repo: { owner: 'o', name: 'r' },
    }));
    expect(items.some((i) => i.hint === '/issues')).toBe(true);
  });
});
