import {
  listRecentRepos,
  parseCodeLocation,
  parseRepoFromPath,
} from '@/lib/recentRepos';
import { cwdFromCodeLocation } from '@/lib/repoPath';
import type { GotoContext, PathNavAnchor } from './types';

/** Synthetic tree root for repo pages that are not blob/tree. */
function repoRootAnchor(
  owner: string,
  name: string,
  refName = 'HEAD',
): PathNavAnchor {
  return {
    owner,
    name,
    refName,
    mode: 'tree',
    path: '',
    cwd: '',
  };
}

/** Build goto context from the current location (and recent repos). */
export function buildGotoContext(pathname: string): GotoContext {
  const repo = parseRepoFromPath(pathname);
  const codeLoc = parseCodeLocation(pathname);
  const code: PathNavAnchor | null = codeLoc
    ? {
        owner: codeLoc.owner,
        name: codeLoc.name,
        refName: codeLoc.refName,
        mode: codeLoc.mode,
        path: codeLoc.path,
        cwd: cwdFromCodeLocation(codeLoc),
      }
    : null;

  // Path jumps: prefer real code location; else treat repo pages as tree root
  const pathNav: PathNavAnchor | null =
    code ??
    (repo ? repoRootAnchor(repo.owner, repo.name, 'HEAD') : null);

  return {
    pathname,
    repo,
    code,
    pathNav,
    recent: listRecentRepos(),
  };
}
