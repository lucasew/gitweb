import { Link, useRouterState } from '@tanstack/react-router';
import {
  ChevronRight,
  CircleDot,
  Code2,
  GitPullRequest,
  Search,
  Workflow,
} from 'lucide-react';
import { useEffect, useId, useState, type CSSProperties } from 'react';
import { clearToken } from '@/lib/auth';
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from '@/lib/theme';
import { subscribeRateLimit, type RateLimitSnapshot } from '@/relay/environment';
import { cn } from '@/lib/cls';
import { parseRepoFromPath, rememberRepo } from '@/lib/recentRepos';

type Props = {
  onOpenPalette: () => void;
  viewerLogin?: string | null;
  viewerAvatarUrl?: string | null;
  signedIn: boolean;
  onSignedOut: () => void;
};

export function TopBar({
  onOpenPalette,
  viewerLogin,
  viewerAvatarUrl,
  signedIn,
  onSignedOut,
}: Props) {
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference);
  const [rl, setRl] = useState<RateLimitSnapshot | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const repo = parseRepoFromPath(pathname);
  const accountPopoverId = `topbar-account-${useId().replace(/:/g, '')}`;
  const accountAnchor = `--${accountPopoverId}`;

  useEffect(() => subscribeRateLimit(setRl), []);

  useEffect(() => {
    if (repo) rememberRepo(repo.owner, repo.name);
  }, [repo?.owner, repo?.name]);

  const section = repoSection(pathname, repo);

  return (
    <header className="sticky top-0 z-40 border-b border-base-300 bg-base-200">
      <div className="navbar min-h-12 gap-1 px-2 w-full min-w-0">
        <nav
          aria-label="Breadcrumb"
          className="flex-none flex items-center gap-0.5 min-w-0 max-w-[min(100%,55%)]"
        >
          <Link
            to="/"
            className="btn btn-ghost btn-sm font-semibold px-2 shrink-0"
          >
            ghweb
          </Link>

          {repo ? (
            <>
              <ChevronRight
                className="size-4 opacity-40 shrink-0"
                aria-hidden
              />
              <Link
                to="/$login"
                params={{ login: repo.owner }}
                className="btn btn-ghost btn-sm px-1.5 min-w-0 font-normal opacity-70 max-w-[8rem] truncate"
                title={repo.owner}
              >
                {repo.owner}
              </Link>
              <ChevronRight
                className="size-4 opacity-40 shrink-0"
                aria-hidden
              />
              <Link
                to="/$owner/$name"
                params={{ owner: repo.owner, name: repo.name }}
                className="btn btn-ghost btn-sm px-1.5 min-w-0 font-medium max-w-[10rem] truncate"
                title={repo.name}
              >
                {repo.name}
              </Link>

              <div
                className="join ms-1 shrink-0"
                role="navigation"
                aria-label="Repository sections"
              >
                <SectionLink
                  to="/$owner/$name"
                  params={{ owner: repo.owner, name: repo.name }}
                  exact
                  active={section === 'code'}
                  label="Code"
                  icon={Code2}
                />
                <SectionLink
                  to="/$owner/$name/issues"
                  params={{ owner: repo.owner, name: repo.name }}
                  active={section === 'issues'}
                  label="Issues"
                  icon={CircleDot}
                />
                <SectionLink
                  to="/$owner/$name/pulls"
                  params={{ owner: repo.owner, name: repo.name }}
                  active={section === 'prs'}
                  label="PRs"
                  icon={GitPullRequest}
                />
                <SectionLink
                  to="/$owner/$name/actions"
                  params={{ owner: repo.owner, name: repo.name }}
                  active={section === 'actions'}
                  label="Actions"
                  icon={Workflow}
                />
              </div>
            </>
          ) : null}
        </nav>

        <div className="flex-1 flex justify-end md:justify-center px-1 min-w-0">
          {/* Narrow: icon-only; md+: full Jump… bar with ⌘K */}
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square md:hidden"
            onClick={onOpenPalette}
            aria-label="Open command palette (⌘K)"
            title="Jump… (⌘K)"
          >
            <Search className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={cn(
              'btn btn-sm btn-ghost border border-base-300 bg-base-100',
              'hidden md:inline-flex w-full max-w-md justify-start gap-2 font-normal text-base-content/60',
            )}
            onClick={onOpenPalette}
            aria-label="Open command palette (⌘K)"
          >
            <Search className="size-4 shrink-0" aria-hidden />
            <span className="truncate">Jump… /code /issues /prs /actions</span>
            <kbd className="kbd kbd-sm ms-auto">⌘K</kbd>
          </button>
        </div>

        <div className="flex-none flex items-center gap-1">
          {rl?.remaining != null && rl.remaining < 500 ? (
            <div
              className="badge badge-warning badge-sm hidden md:inline-flex"
              title="Rate limit remaining"
            >
              API {rl.remaining}
              {rl.limit != null ? `/${rl.limit}` : ''}
            </div>
          ) : null}

          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle avatar placeholder"
            aria-label="Account menu"
            popoverTarget={accountPopoverId}
            style={{ anchorName: accountAnchor } as CSSProperties}
          >
            {viewerAvatarUrl ? (
              <div className="w-8 rounded-full overflow-hidden bg-transparent">
                <img
                  src={viewerAvatarUrl}
                  alt=""
                  className="bg-transparent"
                />
              </div>
            ) : (
              <div className="bg-neutral text-neutral-content w-8 rounded-full">
                <span className="text-xs">
                  {viewerLogin?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
            )}
          </button>
          <ul
            id={accountPopoverId}
            popover="auto"
            className={cn(
              'dropdown menu dropdown-end',
              'w-52 rounded-box bg-base-100 p-2 shadow border border-base-300',
            )}
            style={
              {
                positionAnchor: accountAnchor,
                positionArea: 'bottom span-left',
                positionTryFallbacks: 'flip-block, flip-inline',
              } as CSSProperties
            }
          >
            {viewerLogin ? (
              <li className="menu-title">
                <span>@{viewerLogin}</span>
              </li>
            ) : null}
            <li>
              <button
                type="button"
                onClick={() => {
                  const order: ThemePreference[] = [
                    'system',
                    'light',
                    'dark',
                  ];
                  const i = order.indexOf(theme);
                  const next = order[(i + 1) % order.length]!;
                  setTheme(next);
                  setThemePreference(next);
                }}
              >
                Theme: {theme}
              </button>
            </li>
            {signedIn ? (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    clearToken();
                    onSignedOut();
                  }}
                >
                  Sign out
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </header>
  );
}

function SectionLink({
  to,
  params,
  active,
  label,
  icon: Icon,
  exact,
}: {
  to:
    | '/$owner/$name'
    | '/$owner/$name/issues'
    | '/$owner/$name/pulls'
    | '/$owner/$name/actions';
  params: { owner: string; name: string };
  active: boolean;
  label: string;
  icon: typeof Code2;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      params={params}
      activeOptions={exact ? { exact: true } : undefined}
      className={cn(
        'btn btn-sm join-item btn-ghost px-2',
        active && 'btn-active bg-base-100',
      )}
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="size-4" />
      <span className="hidden lg:inline text-xs">{label}</span>
    </Link>
  );
}

function repoSection(
  pathname: string,
  repo: { owner: string; name: string } | null,
): 'code' | 'issues' | 'prs' | 'actions' | null {
  if (!repo) return null;
  const base = `/${repo.owner}/${repo.name}`;
  if (pathname === base || pathname.startsWith(`${base}/tree/`) || pathname.startsWith(`${base}/blob/`)) {
    return 'code';
  }
  if (pathname.startsWith(`${base}/issues`)) return 'issues';
  if (
    pathname.startsWith(`${base}/pulls`) ||
    pathname.startsWith(`${base}/pull/`)
  ) {
    return 'prs';
  }
  if (pathname.startsWith(`${base}/actions`)) return 'actions';
  return 'code';
}
