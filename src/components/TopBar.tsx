import { Link, useRouterState } from '@tanstack/react-router';
import {
  ChevronRight,
  CircleDot,
  Code2,
  GitPullRequest,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { clearToken } from '@/lib/auth';
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from '@/lib/theme';
import { subscribeRateLimit, type RateLimitSnapshot } from '@/relay/environment';
import { cn } from '@/lib/cls';
import {
  parseCodeLocation,
  parseRepoFromPath,
  rememberRepo,
} from '@/lib/recentRepos';
import { PathBreadcrumb } from '@/components/PathBreadcrumb';

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
  const codeLoc = parseCodeLocation(pathname);

  useEffect(() => subscribeRateLimit(setRl), []);

  useEffect(() => {
    if (repo) rememberRepo(repo.owner, repo.name);
  }, [repo?.owner, repo?.name]);

  const section = repoSection(pathname, repo);
  const showPathCrumbs = codeLoc != null;

  return (
    <header className="sticky top-0 z-40 border-b border-base-300 bg-base-200">
      <div className="navbar min-h-12 gap-1 px-2 w-full min-w-0">
        <nav
          aria-label="Breadcrumb"
          className={cn(
            'flex items-center gap-0.5 min-w-0',
            showPathCrumbs
              ? 'flex-1 max-w-none overflow-x-auto'
              : 'flex-none max-w-[min(100%,55%)]',
          )}
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
                className="btn btn-ghost btn-sm px-1.5 min-w-0 font-normal opacity-70 max-w-[8rem] truncate shrink-0"
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
                className="btn btn-ghost btn-sm px-1.5 min-w-0 font-medium max-w-[10rem] truncate shrink-0"
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
              </div>

              {codeLoc ? (
                <>
                  <ChevronRight
                    className="size-4 opacity-40 shrink-0 ms-1"
                    aria-hidden
                  />
                  <PathBreadcrumb
                    dense
                    className="min-w-0 flex-1"
                    owner={codeLoc.owner}
                    name={codeLoc.name}
                    refName={codeLoc.refName}
                    path={codeLoc.path}
                    isBlob={codeLoc.mode === 'blob'}
                  />
                </>
              ) : null}
            </>
          ) : null}
        </nav>

        <div
          className={cn(
            'flex justify-center px-1 min-w-0',
            showPathCrumbs
              ? 'flex-none w-auto shrink-0'
              : 'flex-1',
          )}
        >
          <button
            type="button"
            className={cn(
              'btn btn-sm btn-ghost border border-base-300 bg-base-100',
              'justify-start gap-2 font-normal text-base-content/60',
              showPathCrumbs
                ? 'btn-square sm:w-auto sm:px-3'
                : 'w-full max-w-md',
            )}
            onClick={onOpenPalette}
            title="Jump… /code /issues /prs"
          >
            <Search className="size-4 shrink-0" />
            <span
              className={cn(
                'truncate',
                showPathCrumbs && 'hidden sm:inline',
              )}
            >
              Jump…
            </span>
            {!showPathCrumbs ? (
              <kbd className="kbd kbd-sm ms-auto hidden sm:inline-flex">
                ⌘K
              </kbd>
            ) : null}
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

          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-sm btn-circle avatar placeholder"
            >
              {viewerAvatarUrl ? (
                <div className="w-8 rounded-full">
                  <img src={viewerAvatarUrl} alt="" />
                </div>
              ) : (
                <div className="bg-neutral text-neutral-content w-8 rounded-full">
                  <span className="text-xs">
                    {viewerLogin?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
              )}
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow border border-base-300"
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
  to: '/$owner/$name' | '/$owner/$name/issues' | '/$owner/$name/pulls';
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
): 'code' | 'issues' | 'prs' | null {
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
  return 'code';
}
