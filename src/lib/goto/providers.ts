import { githubUrlToAppPath } from '@/lib/githubUrl';
import { fuzzyMatch, type RecentRepo } from '@/lib/recentRepos';
import { isPathExpression } from '@/lib/repoPath';
import { pathProvider } from './pathProvider';
import { parseSlashCommand, slashMatches } from './slash';
import type { GotoCandidate, GotoProvider } from './types';

export { pathProvider };

const GROUP = {
  path: 'Path',
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
  ];
}

/** /code /issues /prs for current repo (and empty query). */
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
    if (slash.cmd === 'search') return [];
    return all.filter((c) => {
      const section =
        c.icon === 'code' || c.icon === 'issues' || c.icon === 'prs'
          ? c.icon
          : null;
      return section != null && slashMatches(slash, section);
    });
  }
  if (!q) return all;
  return all.filter((c) => fuzzyMatch(c.value, q));
};

/** /code nixpkgs — section + fuzzy repo. */
export const jumpSectionProvider: GotoProvider = (q, ctx) => {
  const slash = parseSlashCommand(q);
  if (!slash || slash.cmd === 'search' || !slash.rest) return [];
  const repos = filterRepos(ctx.recent, ctx.repo, slash.rest);
  return repos.flatMap((r) => {
    const base = sectionCandidates(r.owner, r.name, GROUP.jump, 30);
    return base.filter((c) => {
      const section =
        c.icon === 'code' || c.icon === 'issues' || c.icon === 'prs'
          ? c.icon
          : null;
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

/** Default provider pipeline (order = registration; priority sorts within). */
export const defaultProviders: GotoProvider[] = [
  pathProvider,
  hereSectionProvider,
  jumpSectionProvider,
  reposProvider,
  urlProvider,
  homeProvider,
  searchProvider,
];
