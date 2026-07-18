import { describe, expect, it } from 'vitest';
import { completionContext } from '../pathSuggest';
import type { PathNavAnchor } from '../types';
import { relativeToLocation, resolveFromCodeLocation } from '../../repoPath';

const root: PathNavAnchor = {
  owner: 'o',
  name: 'r',
  refName: 'main',
  mode: 'tree',
  path: '',
  cwd: '',
};

const nested: PathNavAnchor = {
  owner: 'o',
  name: 'r',
  refName: 'main',
  mode: 'tree',
  path: 'src/lib',
  cwd: 'src/lib',
};

describe('completionContext', () => {
  it('completes first segment at repo root', () => {
    expect(completionContext(root, 'src')).toEqual({
      listDir: '',
      prefix: 'src',
      climbDest: null,
    });
  });

  it('.. and ../ list parent directory', () => {
    expect(completionContext(nested, '..')).toEqual({
      listDir: 'src',
      prefix: '',
      climbDest: { abs: 'src', ups: 1 },
    });
    expect(completionContext(nested, '../')).toEqual({
      listDir: 'src',
      prefix: '',
      climbDest: { abs: 'src', ups: 1 },
    });
  });

  it('../x lists parent with prefix', () => {
    expect(completionContext(nested, '../x')).toEqual({
      listDir: 'src',
      prefix: 'x',
      climbDest: null,
    });
  });
});

describe('relative + resolve', () => {
  it('.. from nested tree is parent, shown as ../', () => {
    expect(
      resolveFromCodeLocation({ mode: 'tree', path: 'src/lib' }, '..'),
    ).toBe('src');
    expect(
      relativeToLocation({ mode: 'tree', path: 'src/lib' }, 'src', true),
    ).toBe('../');
  });

  it('sibling relative', () => {
    expect(
      relativeToLocation(
        { mode: 'tree', path: 'src/lib' },
        'src/lib/bar.ts',
        false,
      ),
    ).toBe('bar.ts');
  });
});
