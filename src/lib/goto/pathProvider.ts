import {
  formatRepoPath,
  isPathExpression,
  resolveFromCodeLocation,
} from '@/lib/repoPath';
import { parseSlashCommand } from './slash';
import type { GotoProvider } from './types';

/**
 * Path provider for ⌘K: type a path, get a destination suggestion, select → go.
 *
 * Active on blob/tree. Resolves relative to the current file/folder
 * (`..` from a file = containing directory; from DESIGN.md → `/`).
 */
export const pathProvider: GotoProvider = (q, ctx) => {
  if (!ctx.code) return [];
  const query = q.trim();
  if (!query) return [];
  if (parseSlashCommand(query)) return [];
  if (!isPathExpression(query, { inCode: true })) return [];

  const resolved = resolveFromCodeLocation(
    { mode: ctx.code.mode, path: ctx.code.path },
    query,
  );
  if (resolved == null) return [];

  const display = formatRepoPath(resolved);
  const { owner, name, refName } = ctx.code;

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
