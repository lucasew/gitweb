import {
  formatRepoPath,
  isPathExpression,
  resolveFromCodeLocation,
} from '@/lib/repoPath';
import { parseSlashCommand } from './slash';
import type { GotoProvider } from './types';

/**
 * Path provider for ⌘K: type a path → suggest destination → select opens it.
 *
 * Active whenever we have a pathNav anchor:
 * - blob/tree: relative to current file/folder
 * - repo home / issues / PRs: relative to repository root (ref HEAD)
 */
export const pathProvider: GotoProvider = (q, ctx) => {
  const anchor = ctx.pathNav;
  if (!anchor) return [];

  const query = q.trim();
  if (!query) return [];
  if (parseSlashCommand(query)) return [];
  if (!isPathExpression(query, { inCode: true })) return [];

  const resolved = resolveFromCodeLocation(
    { mode: anchor.mode, path: anchor.path },
    query,
  );
  if (resolved == null) return [];

  // Staying at root for `..` from root is a no-op suggestion — still ok
  const display = formatRepoPath(resolved);
  const { owner, name, refName } = anchor;

  return [
    {
      id: `path:${resolved || '/'}`,
      label: display,
      hint: query === display ? refName : query,
      value: `path ${query} ${display}`,
      group: 'Path',
      icon: 'path',
      priority: 5,
      action: {
        kind: 'open-repo-path',
        owner,
        name,
        ref: refName,
        path: resolved,
      },
    },
  ];
};
