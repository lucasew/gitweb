/**
 * Repo-relative path resolution for goto / cmdk (POSIX-like).
 */

export function stripSlashes(p: string): string {
  return p.replace(/^\/+|\/+$/g, '');
}

export function cwdFromCodeLocation(loc: {
  mode: 'blob' | 'tree';
  path: string;
}): string {
  if (loc.mode === 'tree') return stripSlashes(loc.path);
  return dirnameRepo(loc.path);
}

function dirnameRepo(path: string): string {
  const p = stripSlashes(path);
  if (!p) return '';
  const i = p.lastIndexOf('/');
  return i === -1 ? '' : p.slice(0, i);
}

/**
 * Resolve `expression` against `baseDir` (both repo-relative).
 * Returns '' for repo root, or a path without leading `/`.
 */
export function resolveRepoPath(
  baseDir: string,
  expression: string,
): string | null {
  const raw = expression.trim();
  if (!raw) return null;

  const base = stripSlashes(baseDir);
  const stack: string[] = base ? base.split('/') : [];

  const segs = raw.startsWith('/')
    ? raw.split('/')
    : raw.split('/');

  if (raw.startsWith('/')) {
    stack.length = 0;
  }

  for (const seg of segs) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      if (stack.length) stack.pop();
      continue;
    }
    if (seg === '...' || seg.includes('\0')) return null;
    stack.push(seg);
  }

  return stack.join('/');
}

/** Pure climb expression (`..`, `../..`, …) → number of ups, else null. */
function pureUps(expression: string): number | null {
  const t = expression.trim().replace(/\/+$/, '');
  if (!t || t === '.') return null;
  const parts = t.split('/');
  if (parts.length === 0 || !parts.every((p) => p === '..')) return null;
  return parts.length;
}

/** Directory the user is "in" (blob → file's folder; tree → path). */
export function locationDir(loc: {
  mode: 'blob' | 'tree';
  path: string;
}): string {
  const cur = stripSlashes(loc.path);
  return loc.mode === 'blob' ? dirnameRepo(cur) : cur;
}

/**
 * Resolve from a code location (blob or tree) — shell cwd semantics.
 * Blob cwd = containing directory; pure `..` climbs from that cwd.
 * From src/lib/foo.ts, `..` → `src`. From DESIGN.md, `..` → `/`.
 */
export function resolveFromCodeLocation(
  loc: { mode: 'blob' | 'tree'; path: string },
  expression: string,
): string | null {
  const raw = expression.trim();
  if (!raw) return null;

  const cwd = locationDir(loc);

  if (raw === '.' || raw === './') return cwd;

  const ups = pureUps(raw);
  if (ups != null) {
    let p = cwd;
    for (let i = 0; i < ups; i++) p = dirnameRepo(p);
    return p;
  }

  return resolveRepoPath(cwd, raw);
}

/**
 * Express `toPath` relative to the location's cwd (for suggestions / Tab).
 * Dirs get a trailing `/` except `.` → `./`.
 */
export function relativeToLocation(
  loc: { mode: 'blob' | 'tree'; path: string },
  toPath: string,
  isDir: boolean,
): string {
  const from = locationDir(loc)
    .split('/')
    .filter(Boolean);
  const to = stripSlashes(toPath).split('/').filter(Boolean);

  let i = 0;
  while (i < from.length && i < to.length && from[i] === to[i]) i++;

  const ups = from.length - i;
  const down = to.slice(i);
  let rel = [...Array.from({ length: ups }, () => '..'), ...down].join('/');

  if (!rel) {
    return isDir ? './' : '.';
  }
  if (isDir && !rel.endsWith('/')) rel += '/';
  return rel;
}

/**
 * Whether the query looks like a path jump (not /code, not owner/repo).
 */
export function isPathExpression(
  q: string,
  opts?: { inCode?: boolean },
): boolean {
  const t = q.trim();
  if (!t || /\s/.test(t)) return false;
  if (
    /^\/(code|issues|prs|pulls|pr|pull|issue|search|s)(\s|$)/i.test(t)
  ) {
    return false;
  }
  if (t.startsWith('.') || t.includes('..')) return true;
  if (t.startsWith('/')) {
    if (t === '/') return true;
    const first = t.slice(1).split('/')[0]?.toLowerCase() ?? '';
    if (['code', 'issues', 'prs', 'pulls', 'search', 's'].includes(first)) {
      return false;
    }
    return true;
  }
  if (t.includes('/')) {
    const parts = t.split('/');
    if (
      !opts?.inCode &&
      parts.length === 2 &&
      parts[0] &&
      parts[1] &&
      !parts[0].includes('.') &&
      !parts[1].includes('.')
    ) {
      return false;
    }
    return true;
  }
  if (/\.[a-zA-Z0-9]{1,12}$/.test(t)) return true;
  if (opts?.inCode && /^[\w.@+-]+$/.test(t)) return true;
  return false;
}

export function appPathForObject(
  owner: string,
  name: string,
  refName: string,
  path: string,
  kind: 'blob' | 'tree',
): string {
  const ref = encodeURIComponent(refName);
  if (!path) {
    if (kind === 'tree') return `/${owner}/${name}/tree/${ref}`;
    return `/${owner}/${name}`;
  }
  const enc = path
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/');
  return `/${owner}/${name}/${kind}/${ref}/${enc}`;
}

/**
 * GitHub `repository.object(expression:)` for a ref + optional path.
 *
 * Bare `ref` / commit SHA resolves to a Commit (or Tag), not a Tree.
 * Root tree must use `ref:` (trailing colon); nested uses `ref:path`.
 */
export function gitObjectExpression(refName: string, path: string): string {
  const ref = refName.trim();
  const p = stripSlashes(path);
  return p ? `${ref}:${p}` : `${ref}:`;
}

/** Display form for repo-relative path ('' → `/`). */
export function formatRepoPath(path: string): string {
  return path ? path : '/';
}
