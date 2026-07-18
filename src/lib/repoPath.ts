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

/**
 * Resolve from a code location (blob or tree).
 *
 * - Pure `..` / `../..`: climb from the **current node** (file or folder).
 *   From DESIGN.md, `..` → `/`. From src/lib/foo.ts, `..` → `src/lib`.
 * - Mixed paths (`../x.ts`, `./y`, `src`): relative to the file’s directory
 *   (blob) or the tree path (tree) — shell cwd semantics.
 */
export function resolveFromCodeLocation(
  loc: { mode: 'blob' | 'tree'; path: string },
  expression: string,
): string | null {
  const raw = expression.trim();
  if (!raw) return null;

  const cur = stripSlashes(loc.path);
  const ups = pureUps(raw);
  if (ups != null) {
    let p = cur;
    for (let i = 0; i < ups; i++) p = dirnameRepo(p);
    return p;
  }

  const base = loc.mode === 'blob' ? dirnameRepo(cur) : cur;
  return resolveRepoPath(base, raw);
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

/** Display form for repo-relative path ('' → `/`). */
export function formatRepoPath(path: string): string {
  return path ? path : '/';
}
