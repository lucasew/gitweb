import { getActiveMeKey, listAccounts } from '@/lib/auth';
import { githubUrlToAppPath } from '@/lib/githubUrl';
import { fuzzyMatch, type RecentRepo } from '@/lib/recentRepos';
import { isPathExpression } from '@/lib/repoPath';
import { parseSlashCommand, slashMatches } from './slash';
import type { GotoCandidate, GotoProvider } from './types';

const GROUP = {
  path: 'Path',
  accounts: 'Accounts',
  here: 'This repository',
  jump: 'Jump',
  repos: 'Repositories',
  nav: 'Navigate',
  search: 'Search',
} as const;

function sectionCandidates(
  owner: string,
  name: string,
  group: string,
  priority: number,
): GotoCandidate[] {
  const base = `/${owner}/${name}`;
  const here = `${owner}/${name}`;
  return [
    {
      id: `code-${here}`,
      label: `Code · ${here}`,
      hint: '/code',
      value: `code ${here} /code`,
      group,
      icon: 'code',
      priority,
      action: { kind: 'navigate', to: base },
    },
    {
      id: `issues-${here}`,
      label: `Issues · ${here}`,
      hint: '/issues',
      value: `issues ${here} /issues`,
      group,
      icon: 'issues',
      priority: priority + 1,
      action: { kind: 'navigate', to: `${base}/issues` },
    },
    {
      id: `prs-${here}`,
      label: `Pull requests · ${here}`,
      hint: '/prs',
      value: `prs pulls ${here} /prs /pulls`,
      group,
      icon: 'prs',
      priority: priority + 2,
      action: { kind: 'navigate', to: `${base}/pulls` },
    },
    {
      id: `actions-${here}`,
      label: `Actions · ${here}`,
      hint: '/actions',
      value: `actions action ci workflows ${here} /actions`,
      group,
      icon: 'actions',
      priority: priority + 3,
      action: { kind: 'navigate', to: `${base}/actions` },
    },
    {
      id: `commits-${here}`,
      label: `Commits · ${here}`,
      hint: '/commits',
      value: `commits commit history log ${here} /commits`,
      group,
      icon: 'commits',
      priority: priority + 4,
      action: {
        kind: 'navigate',
        to: `${base}/commits/HEAD`,
      },
    },
  ];
}

function sectionIcon(
  icon: GotoCandidate['icon'],
): 'code' | 'issues' | 'prs' | 'actions' | 'commits' | null {
  if (
    icon === 'code' ||
    icon === 'issues' ||
    icon === 'prs' ||
    icon === 'actions' ||
    icon === 'commits'
  ) {
    return icon;
  }
  return null;
}

/** /code /issues /prs /actions /commits for current repo (and empty query). */
export const hereSectionProvider: GotoProvider = (q, ctx) => {
  if (!ctx.repo) return [];
  const slash = parseSlashCommand(q);
  const all = sectionCandidates(
    ctx.repo.owner,
    ctx.repo.name,
    GROUP.here,
    20,
  );
  if (slash) {
    if (slash.cmd === 'search' || slash.cmd === 'switch') return [];
    return all.filter((c) => {
      const section = sectionIcon(c.icon);
      return section != null && slashMatches(slash, section);
    });
  }
  if (!q) return all;
  return all.filter((c) => fuzzyMatch(c.value, q));
};

/** /switch [filter] — multi-account */
export const switchAccountProvider: GotoProvider = (q) => {
  const slash = parseSlashCommand(q);
  if (slash?.cmd !== 'switch') return [];
  const filter = slash.rest;
  const active = getActiveMeKey();
  const accounts = listAccounts().filter((a) => a.meKey !== '_migrating');
  return accounts
    .filter((a) => {
      if (!filter) return true;
      const hay = `${a.meKey} ${a.login} ${a.name ?? ''} ${a.baseUrl}`;
      return fuzzyMatch(hay, filter);
    })
    .map((a, i) => ({
      id: `switch-${a.meKey}`,
      label:
        a.meKey === active
          ? `${a.meKey} (active)`
          : a.unhealthy
            ? `${a.meKey} (re-auth)`
            : a.meKey,
      hint: a.baseUrl.replace(/^https?:\/\//, ''),
      value: `switch ${a.meKey} ${a.login}`,
      group: GROUP.accounts,
      icon: 'account' as const,
      priority: 5 + i,
      action: { kind: 'switch-account' as const, meKey: a.meKey },
    }));
};

/** /code nixpkgs — section + fuzzy repo. */
export const jumpSectionProvider: GotoProvider = (q, ctx) => {
  const slash = parseSlashCommand(q);
  if (!slash || slash.cmd === 'search' || slash.cmd === 'switch' || !slash.rest)
    return [];
  const repos = filterRepos(ctx.recent, ctx.repo, slash.rest);
  return repos.flatMap((r) => {
    const base = sectionCandidates(r.owner, r.name, GROUP.jump, 30);
    return base.filter((c) => {
      const section = sectionIcon(c.icon);
      return section != null && slashMatches(slash, section);
    });
  });
};

/** Recent / typed repositories. */
export const reposProvider: GotoProvider = (q, ctx) => {
  const slash = parseSlashCommand(q);
  if (slash) return [];
  if (ctx.pathNav && isPathExpression(q, { inCode: true })) return [];

  const out: GotoCandidate[] = [];
  const repos = filterRepos(ctx.recent, ctx.repo, q);
  for (const r of repos) {
    out.push({
      id: `repo-${r.nameWithOwner}`,
      label: r.nameWithOwner,
      hint: 'repo',
      value: `${r.nameWithOwner} repo`,
      group: GROUP.repos,
      icon: 'repo',
      priority: 40,
      action: { kind: 'navigate', to: `/${r.owner}/${r.name}` },
    });
  }

  // Typed owner/repo when not a path expression
  if (
    q.includes('/') &&
    !q.includes(' ') &&
    !q.startsWith('/') &&
    !q.startsWith('.') &&
    !q.includes('..') &&
    !isPathExpression(q, { inCode: Boolean(ctx.pathNav) })
  ) {
    const bare = q.replace(/^\/+/, '');
    out.push({
      id: `typed-repo-${bare}`,
      label: `Go to ${bare}`,
      value: `repo ${bare}`,
      group: GROUP.nav,
      icon: 'repo',
      priority: 45,
      action: { kind: 'navigate', to: `/${bare}` },
    });
  }

  return out;
};

export const urlProvider: GotoProvider = (q) => {
  const asGithub = githubUrlToAppPath(q);
  if (!asGithub) return [];
  return [
    {
      id: 'url',
      label: `Open ${asGithub}`,
      value: `open ${asGithub}`,
      group: GROUP.nav,
      icon: 'code',
      priority: 50,
      action: { kind: 'navigate', to: asGithub },
    },
  ];
};

export const homeProvider: GotoProvider = (q) => {
  if (parseSlashCommand(q)) return [];
  if (q && !fuzzyMatch('home ghweb', q)) return [];
  if (!q) return [];
  return [
    {
      id: 'home',
      label: 'Home',
      value: 'home ghweb',
      group: GROUP.nav,
      icon: 'home',
      priority: 60,
      action: { kind: 'navigate', to: '/' },
    },
  ];
};

export const searchProvider: GotoProvider = (q, ctx) => {
  const slash = parseSlashCommand(q);
  const searchQ =
    slash?.cmd === 'search' ? slash.rest : !slash ? q : '';
  if (!searchQ.trim()) return [];
  if (ctx.pathNav && isPathExpression(q, { inCode: true }) && !slash) {
    return [];
  }
  const term = searchQ.trim();
  return [
    {
      id: 'search',
      label: `Search “${term}”`,
      hint: '/search',
      value: `search ${term}`,
      group: GROUP.search,
      icon: 'search',
      priority: 70,
      action: {
        kind: 'navigate',
        to: `/search?q=${encodeURIComponent(term)}`,
      },
    },
  ];
};

function filterRepos(
  recent: RecentRepo[],
  current: { owner: string; name: string } | null,
  query: string,
): RecentRepo[] {
  const list = [...recent];
  if (current) {
    const cur: RecentRepo = {
      owner: current.owner,
      name: current.name,
      nameWithOwner: `${current.owner}/${current.name}`,
      at: Date.now(),
    };
    if (!list.some((r) => r.nameWithOwner === cur.nameWithOwner)) {
      list.unshift(cur);
    }
  }
  return list
    .filter((r) => fuzzyMatch(r.nameWithOwner, query))
    .slice(0, 12);
}

/**
 * Sync providers only. Path autocomplete is async (`suggestPaths`) and
 * merged in CommandPalette.
 */
export const defaultProviders: GotoProvider[] = [
  switchAccountProvider,
  hereSectionProvider,
  jumpSectionProvider,
  reposProvider,
  urlProvider,
  homeProvider,
  searchProvider,
];
