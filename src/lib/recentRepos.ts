const KEY = 'ghweb.recentRepos';
const LEGACY_KEY = 'gitweb.recentRepos';
const MAX = 40;

export type RecentRepo = {
  owner: string;
  name: string;
  nameWithOwner: string;
  at: number;
};

export function rememberRepo(owner: string, name: string): void {
  try {
    const entry: RecentRepo = {
      owner,
      name,
      nameWithOwner: `${owner}/${name}`,
      at: Date.now(),
    };
    const prev = listRecentRepos().filter(
      (r) => r.nameWithOwner !== entry.nameWithOwner,
    );
    const next = [entry, ...prev].slice(0, MAX);
    sessionStorage.setItem(KEY, JSON.stringify(next));
    sessionStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

export function listRecentRepos(): RecentRepo[] {
  try {
    let raw = sessionStorage.getItem(KEY);
    if (!raw) {
      const legacy = sessionStorage.getItem(LEGACY_KEY);
      if (legacy) {
        sessionStorage.setItem(KEY, legacy);
        sessionStorage.removeItem(LEGACY_KEY);
        raw = legacy;
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentRepo[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Simple fuzzy: all query chars appear in order (case-insensitive). */
export function fuzzyMatch(haystack: string, query: string): boolean {
  const h = haystack.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return true;
  let i = 0;
  for (const ch of q) {
    i = h.indexOf(ch, i);
    if (i === -1) return false;
    i += 1;
  }
  return true;
}

export function parseRepoFromPath(pathname: string): {
  owner: string;
  name: string;
} | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  if (parts[0] === 'search') return null;
  return { owner: parts[0]!, name: parts[1]! };
}
