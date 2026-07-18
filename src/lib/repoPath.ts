/**
 * Resolve path expressions relative to a repo-relative cwd
 * (POSIX-style `.` / `..` / leading `/` for repo root).
 */

export function cwdFromCodeLocation(loc: {
  mode: 'blob' | 'tree';
  path: string;
}): string {
  if (loc.mode === 'tree') return stripSlashes(loc.path);
  const p = stripSlashes(loc.path);
  if (!p) return '';
  const i = p.lastIndexOf('/');
  return i === -1 ? '' : p.slice(0, i);
}

/** Normalize to path without leading/trailing slashes ('' = repo root). */
export function stripSlashes(p: string): string {
  return p.replace(/^\/+|\/+$/g, '');
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
  const stack: string[] = [];

  const segs = raw.startsWith('/')
    ? raw.split('/')
    : [...(base ? base.split('/') : []), ...raw.split('/')];

  for (const seg of segs) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      if (stack.length) stack.pop();
      continue;
    }
    // reject weird segments
    if (seg === '...' || seg.includes('\0')) return null;
    stack.push(seg);
  }

  return stack.join('/');
}

/**
 * Whether the command palette query should be treated as a path jump
 * while browsing code (not a slash command / owner/repo only).
 *
 * @param inCode — on blob/tree pages, prefer repo-relative paths over
 *   owner/repo disambiguation (so `src` / `src/lib` work from root).
 */
export function isPathExpression(
  q: string,
  opts?: { inCode?: boolean },
): boolean {
  const t = q.trim();
  if (!t || /\s/.test(t)) return false;
  // slash commands for sections
  if (
    /^\/(code|issues|prs|pulls|pr|pull|issue|search|s)(\s|$)/i.test(t)
  ) {
    return false;
  }
  if (t.startsWith('.') || t.includes('..')) return true;
  // absolute in-repo: / or /src/foo (not /search)
  if (t.startsWith('/')) {
    if (t === '/') return true;
    const first = t.slice(1).split('/')[0]?.toLowerCase() ?? '';
    if (['code', 'issues', 'prs', 'pulls', 'search', 's'].includes(first)) {
      return false;
    }
    return true;
  }
  // multi-segment relative
  if (t.includes('/')) {
    const parts = t.split('/');
    // off code pages: `owner/repo` (two plain segments) is not a file path
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
  // bare filename with extension: index.css
  if (/\.[a-zA-Z0-9]{1,12}$/.test(t)) return true;
  // bare directory / file name while already in a repo tree/blob
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
  // Repo root: tree has a dedicated route without splat; empty blob is invalid → repo home
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
