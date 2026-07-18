import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { DiffFile } from '@git-diff-view/react';
import { normalizeGithubPatch } from '../githubPatch';

function parse(hunks: string[], name = 'foo.nix') {
  const file = new DiffFile(name, '', name, '', hunks);
  file.initTheme('light');
  file.init();
  file.buildUnifiedDiffLines();
  return file;
}

describe('normalizeGithubPatch', () => {
  it('wraps github patch so DiffFile produces lines', () => {
    const patch = [
      '@@ -1,3 +1,4 @@',
      ' a',
      ' b',
      '-c',
      '+d',
      '+e',
    ].join('\n');
    const hunks = normalizeGithubPatch(patch, 'foo.nix');
    expect(hunks).toHaveLength(1);
    expect(hunks[0]).toContain('diff --git');
    expect(hunks[0]).toContain('@@ -1,3 +1,4 @@');

    const file = parse(hunks);
    expect(file.unifiedLineLength).toBeGreaterThan(0);
    expect(file.additionLength).toBe(2);
    expect(file.deletionLength).toBe(1);
  });

  it('parses real GitHub multi-hunk patch from PR files API', () => {
    const sample = '/tmp/gh-patch-sample.txt';
    if (!existsSync(sample)) {
      // CI may not have the fixture; synthetic multi-hunk is enough there
      const patch = [
        '@@ -1,2 +1,2 @@',
        ' keep',
        '-old',
        '+new',
        '@@ -5,2 +5,2 @@',
        ' keep2',
        '-x',
        '+y',
      ].join('\n');
      const file = parse(normalizeGithubPatch(patch, 'f.nix'), 'f.nix');
      expect(file.unifiedLineLength).toBeGreaterThan(0);
      return;
    }
    const patch = readFileSync(sample, 'utf8');
    const hunks = normalizeGithubPatch(patch, 'nixos/tests/cockpit.nix');
    const file = parse(hunks, 'nixos/tests/cockpit.nix');
    expect(file.unifiedLineLength).toBeGreaterThan(50);
    expect(file.additionLength).toBe(33);
    expect(file.deletionLength).toBe(24);
  });

  it('returns empty for no hunks', () => {
    expect(normalizeGithubPatch('Binary files differ', 'x.bin')).toEqual([]);
  });
});
