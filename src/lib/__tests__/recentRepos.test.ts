import { describe, expect, it } from 'vitest';
import {
  fuzzyMatch,
  parseCodeLocation,
  parseRepoFromPath,
} from '../recentRepos';

describe('fuzzyMatch', () => {
  it('matches subsequence', () => {
    expect(fuzzyMatch('NixOS/nixpkgs', 'nix')).toBe(true);
    expect(fuzzyMatch('NixOS/nixpkgs', 'nxp')).toBe(true);
    expect(fuzzyMatch('NixOS/nixpkgs', 'zzz')).toBe(false);
  });
});

describe('parseRepoFromPath', () => {
  it('parses owner/name', () => {
    expect(parseRepoFromPath('/NixOS/nixpkgs/pull/1/files')).toEqual({
      owner: 'NixOS',
      name: 'nixpkgs',
    });
  });
});

describe('parseCodeLocation', () => {
  it('parses blob path', () => {
    expect(
      parseCodeLocation('/lucasew/margea/blob/main/src/index.css'),
    ).toEqual({
      owner: 'lucasew',
      name: 'margea',
      mode: 'blob',
      refName: 'main',
      path: 'src/index.css',
    });
  });

  it('parses tree root', () => {
    expect(parseCodeLocation('/o/r/tree/main')).toEqual({
      owner: 'o',
      name: 'r',
      mode: 'tree',
      refName: 'main',
      path: '',
    });
  });

  it('ignores non-code routes', () => {
    expect(parseCodeLocation('/o/r/pull/1/files')).toBeNull();
  });
});
