import { describe, expect, it } from 'vitest';
import { langFromPath } from '../diffLang';

describe('langFromPath', () => {
  it('maps common extensions to hljs ids', () => {
    expect(langFromPath('src/main.rs')).toBe('rust');
    expect(langFromPath('pkg/foo.py')).toBe('python');
    expect(langFromPath('a/b.ts')).toBe('typescript');
    expect(langFromPath('a/b.tsx')).toBe('tsx');
    expect(langFromPath('a/b.nix')).toBe('nix');
    expect(langFromPath('cfg.yml')).toBe('yaml');
    expect(langFromPath('x.go')).toBe('go');
  });

  it('handles special basenames', () => {
    expect(langFromPath('Dockerfile')).toBe('dockerfile');
    expect(langFromPath('path/Makefile')).toBe('makefile');
    expect(langFromPath('package.json')).toBe('json');
  });

  it('falls back safely', () => {
    expect(langFromPath('')).toBe('plaintext');
    expect(langFromPath(null)).toBe('plaintext');
    expect(langFromPath('LICENSE')).toBe('plaintext');
  });
});
