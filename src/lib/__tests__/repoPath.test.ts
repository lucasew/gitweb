import { describe, expect, it } from 'vitest';
import {
  appPathForObject,
  cwdFromCodeLocation,
  gitObjectExpression,
  isPathExpression,
  relativeToLocation,
  resolveFromCodeLocation,
  resolveRepoPath,
} from '../repoPath';

describe('resolveRepoPath', () => {
  it('resolves relative with ..', () => {
    expect(resolveRepoPath('src/lib', '../../foo/bar.ts')).toBe('foo/bar.ts');
    expect(resolveRepoPath('src/lib', '../index.ts')).toBe('src/index.ts');
    expect(resolveRepoPath('src/lib', './x.ts')).toBe('src/lib/x.ts');
  });

  it('absolute from repo root', () => {
    expect(resolveRepoPath('src/lib', '/pkg/a.ts')).toBe('pkg/a.ts');
  });

  it('stays at root on excess ..', () => {
    expect(resolveRepoPath('', '../../x')).toBe('x');
    expect(resolveRepoPath('a', '../../')).toBe('');
  });
});

describe('cwdFromCodeLocation', () => {
  it('blob uses parent dir', () => {
    expect(
      cwdFromCodeLocation({ mode: 'blob', path: 'src/index.css' }),
    ).toBe('src');
  });
  it('tree uses path', () => {
    expect(cwdFromCodeLocation({ mode: 'tree', path: 'src' })).toBe('src');
  });
});

describe('isPathExpression', () => {
  it('detects relative paths', () => {
    expect(isPathExpression('../../foo')).toBe(true);
    expect(isPathExpression('./a.ts')).toBe(true);
    expect(isPathExpression('index.css')).toBe(true);
  });
  it('inCode: folders from root', () => {
    expect(isPathExpression('src', { inCode: true })).toBe(true);
    expect(isPathExpression('src/lib', { inCode: true })).toBe(true);
  });
});

describe('resolveFromCodeLocation', () => {
  it('.. from root blob → root', () => {
    expect(
      resolveFromCodeLocation({ mode: 'blob', path: 'DESIGN.md' }, '..'),
    ).toBe('');
  });

  it('.. from nested blob → parent of containing dir (shell cwd)', () => {
    expect(
      resolveFromCodeLocation(
        { mode: 'blob', path: 'src/lib/foo.ts' },
        '..',
      ),
    ).toBe('src');
  });

  it('../.. from nested blob', () => {
    expect(
      resolveFromCodeLocation(
        { mode: 'blob', path: 'src/lib/foo.ts' },
        '../..',
      ),
    ).toBe('');
  });

  it('sibling from blob', () => {
    expect(
      resolveFromCodeLocation(
        { mode: 'blob', path: 'src/lib/foo.ts' },
        './bar.ts',
      ),
    ).toBe('src/lib/bar.ts');
  });

  it('.. from tree climbs one level', () => {
    expect(
      resolveFromCodeLocation({ mode: 'tree', path: 'src/lib' }, '..'),
    ).toBe('src');
  });
});

describe('relativeToLocation', () => {
  it('formats relative suggestions', () => {
    expect(
      relativeToLocation({ mode: 'tree', path: 'src/lib' }, 'src', true),
    ).toBe('../');
    expect(
      relativeToLocation(
        { mode: 'tree', path: 'src/lib' },
        'src/lib/x.ts',
        false,
      ),
    ).toBe('x.ts');
    expect(
      relativeToLocation({ mode: 'tree', path: '' }, 'src/lib', true),
    ).toBe('src/lib/');
  });
});

describe('appPathForObject', () => {
  it('builds urls', () => {
    expect(appPathForObject('o', 'r', 'main', '', 'tree')).toBe(
      '/o/r/tree/main',
    );
    expect(appPathForObject('o', 'r', 'main', 'src/a.ts', 'blob')).toBe(
      '/o/r/blob/main/src/a.ts',
    );
  });
});

describe('gitObjectExpression', () => {
  const sha = 'c5de9d90c128b77ddc31d9f55b1de5c65d6ab339';

  it('uses trailing colon for root tree (branch or commit)', () => {
    expect(gitObjectExpression('main', '')).toBe('main:');
    expect(gitObjectExpression(sha, '')).toBe(`${sha}:`);
  });

  it('uses ref:path for nested tree/blob', () => {
    expect(gitObjectExpression('main', 'tests/integration.rs')).toBe(
      'main:tests/integration.rs',
    );
    expect(gitObjectExpression(sha, 'tests/integration.rs')).toBe(
      `${sha}:tests/integration.rs`,
    );
  });
});
