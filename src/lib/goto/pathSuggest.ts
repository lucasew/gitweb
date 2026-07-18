import {
  isPathExpression,
  locationDir,
  relativeToLocation,
  resolveFromCodeLocation,
  stripSlashes,
} from '@/lib/repoPath';
import { listRepoDir } from '@/lib/rest';
import { parseSlashCommand } from './slash';
import type { GotoCandidate, GotoContext, PathNavAnchor } from './types';

const MAX_SUGGESTIONS = 50;

/**
 * Async path autocomplete with relative labels (from current location).
 * After `../` or Tab→`../`, lists the parent directory's entries.
 */
export async function suggestPaths(
  ctx: GotoContext,
  query: string,
): Promise<GotoCandidate[]> {
  const anchor = ctx.pathNav;
  if (!anchor) return [];
  const q = query.trim();
  if (!q) return [];
  if (parseSlashCommand(q)) return [];
  if (!isPathExpression(q, { inCode: true })) return [];

  const loc = { mode: anchor.mode, path: anchor.path };
  const { listDir, prefix, climbDest } = completionContext(anchor, q);

  const out: GotoCandidate[] = [];
  const seen = new Set<string>();
  const add = (c: GotoCandidate) => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    out.push(c);
  };

  // Climb target first (e.g. ../) — skip when already at root (no-op)
  if (climbDest != null) {
    const cwd = locationDir(loc);
    const isNoOp = climbDest.abs === cwd;
    if (!isNoOp) {
      const climbLabel =
        Array.from({ length: climbDest.ups }, () => '..').join('/') + '/';
      add({
        id: `path:${climbDest.abs || '/'}`,
        label: climbLabel,
        hint: 'up',
        value: `path climb ${q} ${climbLabel}`,
        group: 'Path',
        icon: 'path',
        priority: 0,
        action: {
          kind: 'open-repo-path',
          owner: anchor.owner,
          name: anchor.name,
          ref: anchor.refName,
          path: climbDest.abs,
          knownKind: 'tree',
        },
      });
    }
  }

  let entries;
  try {
    entries = await listRepoDir(
      anchor.owner,
      anchor.name,
      anchor.refName,
      listDir,
    );
  } catch {
    return out;
  }

  if (!entries) return out;

  const pref = prefix.toLowerCase();
  const hereFile =
    anchor.mode === 'blob' ? stripSlashes(anchor.path) : null;

  for (const e of entries) {
    if (pref && !e.name.toLowerCase().startsWith(pref)) continue;
    // Don't suggest the file you're already viewing
    if (hereFile && e.path === hereFile) continue;

    const isDir = e.type === 'dir';
    const rel = relativeToLocation(loc, e.path, isDir);
    // Skip noisy "./" when listing current dir
    if (rel === './' || rel === '.') continue;

    add({
      id: `path:${e.path}`,
      label: rel,
      hint: isDir ? 'dir' : 'file',
      value: `path ${q} ${rel} ${e.path}`,
      group: 'Path',
      icon: 'path',
      priority: isDir ? 10 : 20,
      action: {
        kind: 'open-repo-path',
        owner: anchor.owner,
        name: anchor.name,
        ref: anchor.refName,
        path: e.path,
        knownKind: isDir ? 'tree' : 'blob',
      },
    });

    if (out.length >= MAX_SUGGESTIONS + 1) break;
  }

  out.sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));
  return out;
}

export type CompletionContext = {
  /** Absolute repo dir to list via API */
  listDir: string;
  /** Filter on entry name */
  prefix: string;
  /** Pure climb destination, if query is only .. */
  climbDest: { abs: string; ups: number } | null;
};

/**
 * Where to list + name prefix. Pure `..` / `../` lists the **parent** dir.
 */
export function completionContext(
  anchor: PathNavAnchor,
  query: string,
): CompletionContext {
  const q = query.trim();
  const loc = { mode: anchor.mode, path: anchor.path };

  const ups = countUps(q);
  if (ups != null && ups > 0) {
    const abs = resolveFromCodeLocation(loc, q.replace(/\/+$/, '') || '..') ?? '';
    // List the directory we land on (parent), so children appear after ../
    return {
      listDir: abs,
      prefix: '',
      climbDest: { abs, ups },
    };
  }

  if (q === '.' || q === './') {
    const dir = resolveFromCodeLocation(loc, '.') ?? '';
    return { listDir: dir, prefix: '', climbDest: null };
  }

  // Browse into a directory: `src/` or `../lib/`
  if (q.endsWith('/')) {
    const dir = resolveFromCodeLocation(loc, q) ?? '';
    return { listDir: dir, prefix: '', climbDest: null };
  }

  // Single segment in current dir
  if (!q.includes('/')) {
    const listDir = resolveFromCodeLocation(loc, '.') ?? '';
    return { listDir, prefix: q, climbDest: null };
  }

  // `src/li` or `../li` — list parent, filter last segment
  const slash = q.lastIndexOf('/');
  const parentExpr = q.slice(0, slash);
  const prefix = q.slice(slash + 1);
  // parentExpr may be `..` or `src` or ``
  const parentQuery =
    parentExpr === '' ? '.' : parentExpr.endsWith('/') ? parentExpr : parentExpr;
  const listDir = resolveFromCodeLocation(loc, parentQuery) ?? '';
  return { listDir, prefix, climbDest: null };
}

/** Number of leading `..` segments if query is only climbs (optional trailing /). */
function countUps(q: string): number | null {
  const t = q.trim().replace(/\/+$/, '');
  if (!t) return null;
  const parts = t.split('/');
  if (parts.length === 0 || !parts.every((p) => p === '..')) return null;
  return parts.length;
}
