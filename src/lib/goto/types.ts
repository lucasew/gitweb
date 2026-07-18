import type { RecentRepo } from '@/lib/recentRepos';

/** Anchor for path expressions (blob/tree, or synthetic repo root). */
export type PathNavAnchor = {
  owner: string;
  name: string;
  refName: string;
  mode: 'blob' | 'tree';
  /** Repo-relative path ('' at tree/repo root). */
  path: string;
  /** Directory used for non-climb relative paths. */
  cwd: string;
};

/** Where the user is when opening ⌘K. */
export type GotoContext = {
  pathname: string;
  repo: { owner: string; name: string } | null;
  /** Present on real blob/tree routes only. */
  code: PathNavAnchor | null;
  /**
   * Path provider anchor: real code location, or repo root at HEAD when on
   * any repo page (home, issues, …) so paths work from `/owner/repo`.
   */
  pathNav: PathNavAnchor | null;
  recent: RecentRepo[];
};

export type GotoIcon =
  | 'code'
  | 'issues'
  | 'prs'
  | 'path'
  | 'home'
  | 'search'
  | 'repo';

/** What happens when a candidate is selected. */
export type GotoAction =
  | { kind: 'navigate'; to: string }
  | {
      kind: 'open-repo-path';
      owner: string;
      name: string;
      ref: string;
      /** '' = repository root tree */
      path: string;
    };

export type GotoCandidate = {
  id: string;
  label: string;
  hint?: string;
  /** cmdk value (search text) */
  value: string;
  group: string;
  icon?: GotoIcon;
  /** Lower sorts first within / across groups after group order. */
  priority: number;
  action: GotoAction;
};

export type GotoProvider = (
  query: string,
  ctx: GotoContext,
) => GotoCandidate[];
