import {
  listRecentRepos,
  parseCodeLocation,
  parseRepoFromPath,
} from '@/lib/recentRepos';
import { cwdFromCodeLocation } from '@/lib/repoPath';
import type { GotoContext } from './types';

/** Build goto context from the current location (and recent repos). */
export function buildGotoContext(pathname: string): GotoContext {
  const repo = parseRepoFromPath(pathname);
  const codeLoc = parseCodeLocation(pathname);
  const code = codeLoc
    ? {
        owner: codeLoc.owner,
        name: codeLoc.name,
        refName: codeLoc.refName,
        mode: codeLoc.mode,
        path: codeLoc.path,
        cwd: cwdFromCodeLocation(codeLoc),
      }
    : null;

  return {
    pathname,
    repo,
    code,
    recent: listRecentRepos(),
  };
}
