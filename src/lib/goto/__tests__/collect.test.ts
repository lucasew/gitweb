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

const codeAtDesign = ctx({
  pathname: '/lewtec/contapila/blob/master/DESIGN.md',
  repo: { owner: 'lewtec', name: 'contapila' },
  code: {
    owner: 'lewtec',
    name: 'contapila',
    refName: 'master',
    mode: 'blob',
    path: 'DESIGN.md',
    cwd: '',
  },
});

describe('path provider via collect', () => {
  it('.. from DESIGN.md suggests /', () => {
    const items = collectGotoCandidates('..', codeAtDesign);
    const path = items.find((i) => i.group === 'Path');
    expect(path?.label).toBe('/');
    expect(path?.action).toEqual({
      kind: 'open-repo-path',
      owner: 'lewtec',
      name: 'contapila',
      ref: 'master',
      path: '',
    });
  });

  it('suggests resolved path for nested relative', () => {
    const items = collectGotoCandidates(
      '../x.ts',
      ctx({
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
      }),
    );
    const path = items.find((i) => i.group === 'Path');
    // ../x.ts from src/lib/a.ts → sibling-up: src/x.ts
    expect(path?.label).toBe('src/x.ts');
    expect(path?.action).toMatchObject({
      kind: 'open-repo-path',
      path: 'src/x.ts',
    });
  });

  it('folder from tree root', () => {
    const items = collectGotoCandidates(
      'src',
      ctx({
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
      }),
    );
    expect(items.find((i) => i.group === 'Path')?.label).toBe('src');
  });
});

describe('section providers', () => {
  it('offers slash sections for current repo', () => {
    const items = collectGotoCandidates(
      '/issues',
      ctx({
        pathname: '/o/r',
        repo: { owner: 'o', name: 'r' },
      }),
    );
    expect(items.some((i) => i.hint === '/issues')).toBe(true);
  });
});
