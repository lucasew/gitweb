import { describe, expect, it } from 'vitest';
import {
  appPathForObject,
  cwdFromCodeLocation,
  isPathExpression,
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
    expect(isPathExpression('/src/x')).toBe(true);
  });
  it('ignores slash commands', () => {
    expect(isPathExpression('/code')).toBe(false);
    expect(isPathExpression('/issues foo')).toBe(false);
  });
  it('inCode: folders from root (no extension)', () => {
    expect(isPathExpression('src', { inCode: true })).toBe(true);
    expect(isPathExpression('src/lib', { inCode: true })).toBe(true);
    expect(isPathExpression('src/lib')).toBe(false);
  });
});

describe('resolveFromCodeLocation', () => {
  it('.. from root blob (DESIGN.md) → repo root', () => {
    expect(
      resolveFromCodeLocation({ mode: 'blob', path: 'DESIGN.md' }, '..'),
    ).toBe('');
  });

  it('.. from nested blob → containing folder', () => {
    expect(
      resolveFromCodeLocation(
        { mode: 'blob', path: 'src/lib/foo.ts' },
        '..',
      ),
    ).toBe('src/lib');
  });

  it('../.. from nested blob → parent of containing folder', () => {
    expect(
      resolveFromCodeLocation(
        { mode: 'blob', path: 'src/lib/foo.ts' },
        '../..',
      ),
    ).toBe('src');
  });

  it('sibling file from blob', () => {
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

  it('folder from tree root', () => {
    expect(
      resolveFromCodeLocation({ mode: 'tree', path: '' }, 'src'),
    ).toBe('src');
  });
});

describe('appPathForObject', () => {
  it('builds blob and tree urls', () => {
    expect(appPathForObject('o', 'r', 'main', 'src/a.ts', 'blob')).toBe(
      '/o/r/blob/main/src/a.ts',
    );
    expect(appPathForObject('o', 'r', 'main', '', 'tree')).toBe(
      '/o/r/tree/main',
    );
    expect(appPathForObject('o', 'r', 'main', 'src', 'tree')).toBe(
      '/o/r/tree/main/src',
    );
  });
});
