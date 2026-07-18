/**
 * Normalize GitHub REST pull-file `patch` for @git-diff-view.
 *
 * GitHub returns a partial unified diff (starts at `@@`, no git headers).
 * DiffView needs a full document (`diff --git` / `---` / `+++` / hunks) as a
 * **single** hunks[] entry — splitting into bare `@@` hunks parses to 0 lines.
 */

export function normalizeGithubPatch(
  patch: string,
  filename: string,
  previousFilename?: string | null,
  status?: string,
): string[] {
  if (!patch || !patch.trim()) return [];

  let body = patch.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!body.endsWith('\n')) body += '\n';

  const firstHunk = body.indexOf('@@');
  if (firstHunk === -1) return [];
  body = body.slice(firstHunk);

  const { oldName, newName } = patchFileNames(
    filename,
    previousFilename,
    status,
  );

  // Full unified-diff document (one element). Multi-element bare @@ hunks
  // silently render empty in @git-diff-view.
  const full = [
    `diff --git a/${escapePath(oldName)} b/${escapePath(newName)}`,
    oldName === '/dev/null' ? 'new file mode 100644' : null,
    newName === '/dev/null' ? 'deleted file mode 100644' : null,
    `--- ${oldName === '/dev/null' ? '/dev/null' : `a/${escapePath(oldName)}`}`,
    `+++ ${newName === '/dev/null' ? '/dev/null' : `b/${escapePath(newName)}`}`,
    body.replace(/\n$/, ''), // joined below with final newline
  ]
    .filter((l): l is string => l != null)
    .join('\n');

  return [`${full}\n`];
}

function escapePath(path: string): string {
  // Keep path as-is; GitHub paths rarely need quoting for this viewer
  return path;
}

export function patchFileNames(
  filename: string,
  previousFilename?: string | null,
  status?: string,
): { oldName: string; newName: string } {
  if (status === 'added') {
    return { oldName: '/dev/null', newName: filename };
  }
  if (status === 'removed') {
    return { oldName: filename, newName: '/dev/null' };
  }
  if ((status === 'renamed' || status === 'copied') && previousFilename) {
    return { oldName: previousFilename, newName: filename };
  }
  return {
    oldName: previousFilename || filename,
    newName: filename,
  };
}
