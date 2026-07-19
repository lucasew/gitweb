import { describe, expect, it } from 'vitest';
import { collectGotoCandidates } from '../collect';
import type { GotoContext } from '../types';

function ctx(partial: Partial<GotoContext> = {}): GotoContext {
  const base: GotoContext = {
    pathname: '/',
    repo: null,
    code: null,
    pathNav: null,
    recent: [],
    ...partial,
  };
  if (partial.code && partial.pathNav === undefined) {
    base.pathNav = partial.code;
  }
  return base;
}

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

  it('isolates /code from commits (commits is its own section icon)', () => {
    const here = ctx({
      pathname: '/o/r',
      repo: { owner: 'o', name: 'r' },
    });
    const code = collectGotoCandidates('/code', here);
    expect(code.map((i) => i.hint)).toEqual(['/code']);
    expect(code.every((i) => i.icon === 'code')).toBe(true);

    const commits = collectGotoCandidates('/commits', here);
    expect(commits.map((i) => i.hint)).toEqual(['/commits']);
    expect(commits.every((i) => i.icon === 'commits')).toBe(true);
  });

  it('does not invent path items sync (async pathSuggest owns Path group)', () => {
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
    expect(items.every((i) => i.group !== 'Path')).toBe(true);
  });
});
