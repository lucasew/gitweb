import { Command } from 'cmdk';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  CircleDot,
  Code2,
  GitPullRequest,
  Home,
  Search,
} from 'lucide-react';
import { githubUrlToAppPath } from '@/lib/githubUrl';
import {
  fuzzyMatch,
  listRecentRepos,
  parseRepoFromPath,
  type RecentRepo,
} from '@/lib/recentRepos';
import { cn } from '@/lib/cls';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CmdItem = {
  id: string;
  label: string;
  hint?: string;
  value: string;
  path: string;
  group: string;
  icon?: typeof Code2;
};

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [q, setQ] = useState('');
  const currentRepo = parseRepoFromPath(pathname);

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape' && open) onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const items = useMemo(
    () => buildItems(q, currentRepo, listRecentRepos()),
    [q, currentRepo, pathname],
  );

  if (!open) return null;

  const go = (path: string) => {
    onOpenChange(false);
    void navigate({ to: path });
  };

  const groups = groupBy(items, (i) => i.group);

  return (
    <div className="modal modal-open">
      <div className="modal-box p-0 overflow-hidden w-full max-w-lg">
        <Command label="Command palette" className="bg-base-100" shouldFilter={false}>
          <Command.Input
            value={q}
            onValueChange={setQ}
            placeholder=" /code  /issues  /prs  ·  owner/repo  ·  search…"
            className="input input-bordered w-full rounded-none border-0 border-b border-base-300 focus:outline-none"
            autoFocus
          />
          <Command.List className="max-h-[min(60vh,24rem)] overflow-auto p-2">
            <Command.Empty className="p-3 text-sm opacity-60">
              No matches
            </Command.Empty>
            {Object.entries(groups).map(([group, list]) => (
              <Command.Group
                key={group}
                heading={group}
                className="text-xs [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:opacity-50 [&_[cmdk-group-heading]]:font-medium"
              >
                {list.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.id}
                      value={item.value}
                      onSelect={() => go(item.path)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded cursor-pointer',
                        'aria-selected:bg-base-200',
                      )}
                    >
                      {Icon ? (
                        <Icon className="size-4 shrink-0 opacity-70" />
                      ) : null}
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.hint ? (
                        <span className="text-xs opacity-50 shrink-0 font-mono">
                          {item.hint}
                        </span>
                      ) : null}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
      <button
        type="button"
        className="modal-backdrop bg-black/40"
        onClick={() => onOpenChange(false)}
        aria-label="Close"
      />
    </div>
  );
}

function buildItems(
  rawQ: string,
  current: { owner: string; name: string } | null,
  recent: RecentRepo[],
): CmdItem[] {
  const items: CmdItem[] = [];
  const q = rawQ.trim();
  const slash = parseSlashCommand(q);

  // Location-scoped section jumps
  if (current) {
    const base = `/${current.owner}/${current.name}`;
    const here = `${current.owner}/${current.name}`;
    const sectionItems: CmdItem[] = [
      {
        id: 'here-code',
        label: `Code · ${here}`,
        hint: '/code',
        value: `code ${here} /code`,
        path: base,
        group: 'This repository',
        icon: Code2,
      },
      {
        id: 'here-issues',
        label: `Issues · ${here}`,
        hint: '/issues',
        value: `issues ${here} /issues`,
        path: `${base}/issues`,
        group: 'This repository',
        icon: CircleDot,
      },
      {
        id: 'here-prs',
        label: `Pull requests · ${here}`,
        hint: '/prs',
        value: `prs pulls ${here} /prs /pulls`,
        path: `${base}/pulls`,
        group: 'This repository',
        icon: GitPullRequest,
      },
    ];
    for (const it of sectionItems) {
      if (slash) {
        if (slashMatches(slash, it.hint ?? '')) items.push(it);
      } else if (fuzzyMatch(it.value, q)) {
        items.push(it);
      }
    }
  }

  // Slash on a fuzzy-matched other repo: /code nixpkgs
  if (slash && slash.rest) {
    const repos = filterRepos(recent, current, slash.rest);
    for (const r of repos) {
      items.push(sectionItemFor(r, slash.cmd));
    }
  } else if (!slash || !slash.rest) {
    // Recent / fuzzy repos
    const repos = filterRepos(recent, current, slash ? '' : q);
    for (const r of repos) {
      if (slash) {
        items.push(sectionItemFor(r, slash.cmd));
      } else {
        items.push({
          id: `repo-${r.nameWithOwner}`,
          label: r.nameWithOwner,
          hint: 'repo',
          value: `${r.nameWithOwner} repo`,
          path: `/${r.owner}/${r.name}`,
          group: 'Repositories',
          icon: Code2,
        });
      }
    }
  }

  // Global
  if (!slash && fuzzyMatch('home ghweb', q)) {
    items.push({
      id: 'home',
      label: 'Home',
      value: 'home ghweb',
      path: '/',
      group: 'Navigate',
      icon: Home,
    });
  }

  const asGithub = githubUrlToAppPath(q);
  if (asGithub) {
    items.push({
      id: 'url',
      label: `Open ${asGithub}`,
      value: `open ${asGithub}`,
      path: asGithub,
      group: 'Navigate',
    });
  }

  if (q.includes('/') && !q.includes(' ') && !q.startsWith('/')) {
    const bare = q.replace(/^\/+/, '');
    items.push({
      id: 'typed-repo',
      label: `Go to ${bare}`,
      value: `repo ${bare}`,
      path: `/${bare}`,
      group: 'Navigate',
      icon: Code2,
    });
  }

  const searchQ = slash?.cmd === 'search' ? slash.rest : !slash ? q : '';
  if (searchQ.trim()) {
    items.push({
      id: 'search',
      label: `Search “${searchQ.trim()}”`,
      hint: '/search',
      value: `search ${searchQ}`,
      path: `/search?q=${encodeURIComponent(searchQ.trim())}`,
      group: 'Search',
      icon: Search,
    });
  }

  // Prefer current-repo section commands when query empty
  if (!q && current) {
    // already added This repository
  }

  // Dedupe by path+label
  const seen = new Set<string>();
  return items.filter((it) => {
    const k = `${it.path}::${it.label}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parseSlashCommand(q: string): { cmd: string; rest: string } | null {
  if (!q.startsWith('/')) return null;
  const body = q.slice(1).trim();
  const [cmdRaw, ...restParts] = body.split(/\s+/);
  const cmd = (cmdRaw ?? '').toLowerCase();
  if (!cmd) return { cmd: '', rest: '' };
  const rest = restParts.join(' ').trim();
  // aliases
  const normalized =
    cmd === 'pulls' || cmd === 'pr' || cmd === 'pull'
      ? 'prs'
      : cmd === 'issue'
        ? 'issues'
        : cmd === 's'
          ? 'search'
          : cmd;
  return { cmd: normalized, rest };
}

function slashMatches(slash: { cmd: string }, hint: string): boolean {
  if (!slash.cmd) return true;
  const h = hint.replace(/^\//, '').toLowerCase();
  if (slash.cmd === 'prs') return h === 'prs' || h === 'pulls';
  return h.startsWith(slash.cmd) || slash.cmd.startsWith(h);
}

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

function sectionItemFor(
  r: RecentRepo,
  cmd: string,
): CmdItem {
  const base = `/${r.owner}/${r.name}`;
  if (cmd === 'issues') {
    return {
      id: `issues-${r.nameWithOwner}`,
      label: `Issues · ${r.nameWithOwner}`,
      hint: '/issues',
      value: `issues ${r.nameWithOwner}`,
      path: `${base}/issues`,
      group: 'Jump',
      icon: CircleDot,
    };
  }
  if (cmd === 'prs') {
    return {
      id: `prs-${r.nameWithOwner}`,
      label: `PRs · ${r.nameWithOwner}`,
      hint: '/prs',
      value: `prs ${r.nameWithOwner}`,
      path: `${base}/pulls`,
      group: 'Jump',
      icon: GitPullRequest,
    };
  }
  // default /code
  return {
    id: `code-${r.nameWithOwner}`,
    label: `Code · ${r.nameWithOwner}`,
    hint: '/code',
    value: `code ${r.nameWithOwner}`,
    path: base,
    group: 'Jump',
    icon: Code2,
  };
}

function groupBy<T>(arr: T[], key: (t: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}
