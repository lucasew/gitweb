/** Build GitHub / ghweb blob URLs (optional #L n or #Ln-Lm). */

export type LineRange = {
  start: number;
  end?: number;
};

export function lineHash(range: LineRange): string {
  const start = Math.max(1, range.start);
  const end = range.end != null ? Math.max(start, range.end) : null;
  if (end != null && end !== start) return `#L${start}-L${end}`;
  return `#L${start}`;
}

export function parseLineHash(
  hash: string,
): { start: number; end: number } | null {
  const m = /^#?L(\d+)(?:-L?(\d+))?$/i.exec(hash.trim());
  if (!m) return null;
  const start = Number(m[1]);
  const end = m[2] ? Number(m[2]) : start;
  if (!Number.isFinite(start) || start < 1) return null;
  return { start, end: Number.isFinite(end) && end >= start ? end : start };
}

/** Encode each path segment (preserve `/`). */
export function encodeRepoPath(path: string): string {
  return path
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/');
}

export function githubBlobUrl(
  owner: string,
  name: string,
  ref: string,
  path: string,
  range?: LineRange | null,
): string {
  const base = `https://github.com/${owner}/${name}/blob/${encodeRepoPath(ref)}/${encodeRepoPath(path)}`;
  return range ? `${base}${lineHash(range)}` : base;
}

/** App-relative path (for router + absolute origin copy). */
export function ghwebBlobPath(
  owner: string,
  name: string,
  ref: string,
  path: string,
  range?: LineRange | null,
): string {
  const base = `/${owner}/${name}/blob/${encodeURIComponent(ref)}/${encodeRepoPath(path)}`;
  return range ? `${base}${lineHash(range)}` : base;
}

export function ghwebBlobUrl(
  owner: string,
  name: string,
  ref: string,
  path: string,
  range?: LineRange | null,
  origin: string = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  return `${origin}${ghwebBlobPath(owner, name, ref, path, range)}`;
}
