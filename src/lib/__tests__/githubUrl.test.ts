import { describe, expect, it } from 'vitest';
import { githubUrlToAppPath, knownGithubWebHosts } from '../githubUrl';

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

  it('maps GHE web hosts when listed', () => {
    expect(
      githubUrlToAppPath('https://ghe.example.com/org/repo/issues/3', {
        hosts: ['ghe.example.com'],
      }),
    ).toBe('/org/repo/issues/3');
    expect(
      githubUrlToAppPath('https://www.ghe.example.com/org/repo', {
        hosts: ['ghe.example.com'],
      }),
    ).toBe('/org/repo');
  });

  it('rejects GHE hosts not in the allow list', () => {
    expect(
      githubUrlToAppPath('https://ghe.example.com/org/repo', {
        hosts: ['other.example.com'],
      }),
    ).toBeNull();
  });

  it('preserves query strings', () => {
    expect(
      githubUrlToAppPath('https://github.com/o/r/issues?q=is%3Aopen'),
    ).toBe('/o/r/issues?q=is%3Aopen');
  });
});

describe('knownGithubWebHosts', () => {
  it('always includes github.com', () => {
    const hosts = knownGithubWebHosts();
    expect(hosts.has('github.com')).toBe(true);
  });
});
