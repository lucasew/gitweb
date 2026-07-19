import {
  getGraphqlUrl,
  listAccounts,
  webHostFromGraphql,
} from '@/lib/auth';

/** Hosts we always treat as GitHub web origins. */
const BUILTIN_WEB_HOSTS = new Set(['github.com', 'www.github.com']);

export type GithubUrlToAppPathOptions = {
  /**
   * Extra web hosts to accept (hostname only). When omitted, includes
   * github.com plus active account and roster GraphQL→web hosts (GHE).
   */
  hosts?: Iterable<string>;
};

/** Normalize a host or URL fragment to a lowercase hostname. */
function normalizeHost(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '');
  const slash = s.indexOf('/');
  if (slash >= 0) s = s.slice(0, slash);
  return s;
}

/**
 * Known web hosts for the current session: github.com and every saved
 * account's web origin (from GraphQL base URL).
 */
export function knownGithubWebHosts(): Set<string> {
  const hosts = new Set(BUILTIN_WEB_HOSTS);
  try {
    hosts.add(normalizeHost(webHostFromGraphql(getGraphqlUrl())));
    for (const acc of listAccounts()) {
      hosts.add(normalizeHost(webHostFromGraphql(acc.baseUrl)));
    }
  } catch {
    /* no storage / SSR — builtin hosts still work */
  }
  return hosts;
}

function hostAllowed(hostname: string, hosts: Set<string>): boolean {
  const h = hostname.toLowerCase();
  if (hosts.has(h)) return true;
  // www.ghe.example.com ↔ ghe.example.com
  if (h.startsWith('www.') && hosts.has(h.slice(4))) return true;
  if (hosts.has(`www.${h}`)) return true;
  return false;
}

/**
 * Parse GitHub (or GHE) web URLs into in-app paths when supported.
 * Bare `owner/repo` paths are accepted without a host.
 */
export function githubUrlToAppPath(
  input: string,
  options?: GithubUrlToAppPathOptions,
): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    const bare = input.trim().replace(/^\/+/, '');
    if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\/.*)?$/.test(bare)) {
      return `/${bare}`;
    }
    return null;
  }

  const allowed =
    options?.hosts != null
      ? new Set([...options.hosts].map(normalizeHost))
      : knownGithubWebHosts();
  // Always keep public github.com so paste works before login / empty roster
  for (const b of BUILTIN_WEB_HOSTS) allowed.add(b);

  if (!hostAllowed(url.hostname, allowed)) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  return `/${parts.join('/')}${url.search}`;
}
