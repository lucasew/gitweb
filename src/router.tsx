import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { Suspense, lazy, useState, type ReactNode } from 'react';
import { SimpleErrorBoundary } from '@/components/SimpleErrorBoundary';
import { TopBar } from '@/components/TopBar';
import { RepoSideNav } from '@/components/RepoSideNav';
import { CommandPalette } from '@/components/CommandPalette';
import { LoadingBlock } from '@/components/LoadingBlock';
import { graphql, useLazyLoadQuery } from 'react-relay';

const HomePage = lazy(() =>
  import('@/screens/HomePage').then((m) => ({ default: m.HomePage })),
);
const RepoPage = lazy(() =>
  import('@/screens/RepoPage').then((m) => ({ default: m.RepoPage })),
);
const CodeBrowserPage = lazy(() =>
  import('@/screens/CodeBrowserPage').then((m) => ({
    default: m.CodeBrowserPage,
  })),
);
const IssuesListPage = lazy(() =>
  import('@/screens/IssuesListPage').then((m) => ({
    default: m.IssuesListPage,
  })),
);
const IssueDetailPage = lazy(() =>
  import('@/screens/IssueDetailPage').then((m) => ({
    default: m.IssueDetailPage,
  })),
);
const PullsListPage = lazy(() =>
  import('@/screens/PullsListPage').then((m) => ({ default: m.PullsListPage })),
);
const PullDetailPage = lazy(() =>
  import('@/screens/PullDetailPage').then((m) => ({
    default: m.PullDetailPage,
  })),
);
const SearchPage = lazy(() =>
  import('@/screens/SearchPage').then((m) => ({ default: m.SearchPage })),
);
import type { routerViewerQuery } from './__generated__/routerViewerQuery.graphql';

const viewerQuery = graphql`
  query routerViewerQuery {
    viewer {
      login
      avatarUrl
    }
  }
`;

function ViewerChrome(props: {
  children: ReactNode;
  contextLabel?: string;
  repo?: { owner: string; name: string };
}) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading session…" />}>
      <ViewerChromeInner {...props} />
    </Suspense>
  );
}

function ViewerChromeInner({
  children,
  contextLabel,
  repo,
}: {
  children: ReactNode;
  contextLabel?: string;
  repo?: { owner: string; name: string };
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const viewer = useLazyLoadQuery<routerViewerQuery>(viewerQuery, {});

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenNav={repo ? () => setDrawerOpen(true) : undefined}
        contextLabel={contextLabel}
        viewerLogin={viewer.viewer.login}
        viewerAvatarUrl={viewer.viewer.avatarUrl}
        signedIn
        onSignedOut={() => {
          window.location.href = '/';
        }}
      />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <div className="flex flex-1 min-h-0">
        {repo ? (
          <>
            <aside className="hidden md:block w-44 shrink-0 border-r border-base-300 bg-base-200/50">
              <RepoSideNav owner={repo.owner} name={repo.name} />
            </aside>
            {drawerOpen ? (
              <div className="md:hidden fixed inset-0 z-50 flex">
                <aside className="w-56 bg-base-100 border-r border-base-300 shadow-lg">
                  <div className="p-2 flex justify-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setDrawerOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                  <RepoSideNav
                    owner={repo.owner}
                    name={repo.name}
                    className="pb-8"
                  />
                </aside>
                <button
                  type="button"
                  className="flex-1 bg-black/40"
                  aria-label="Close drawer"
                  onClick={() => setDrawerOpen(false)}
                />
              </div>
            ) : null}
          </>
        ) : null}
        <main className="flex-1 min-w-0 overflow-auto">
          <Suspense fallback={<LoadingBlock />}>
            <SimpleErrorBoundary>{children}</SimpleErrorBoundary>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function Suspend({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingBlock />}>{children}</Suspense>;
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <ViewerChrome>
      <Suspend>
        <HomePage />
      </Suspend>
    </ViewerChrome>
  ),
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === 'string' ? s.q : '',
  }),
  component: function SearchRoute() {
    const { q } = searchRoute.useSearch();
    return (
      <ViewerChrome>
        <Suspend>
          <SearchPage q={q} />
        </Suspend>
      </ViewerChrome>
    );
  },
});

const repoLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$owner/$name',
  component: function RepoLayout() {
    const { owner, name } = repoLayoutRoute.useParams();
    return (
      <ViewerChrome
        contextLabel={`${owner}/${name}`}
        repo={{ owner, name }}
      >
        <Outlet />
      </ViewerChrome>
    );
  },
});

const repoIndexRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/',
  component: function RepoIndex() {
    const { owner, name } = repoLayoutRoute.useParams();
    return (
      <Suspend>
        <RepoPage owner={owner} name={name} />
      </Suspend>
    );
  },
});

const treeRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/tree/$ref/$',
  component: function TreeRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    const { ref } = treeRoute.useParams();
    const splat = treeRoute.useParams()._splat ?? '';
    return (
      <Suspend>
        <CodeBrowserPage
          owner={owner}
          name={name}
          refName={ref}
          path={splat}
          mode="tree"
        />
      </Suspend>
    );
  },
});

const blobRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/blob/$ref/$',
  component: function BlobRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    const { ref } = blobRoute.useParams();
    const splat = blobRoute.useParams()._splat ?? '';
    return (
      <Suspend>
        <CodeBrowserPage
          owner={owner}
          name={name}
          refName={ref}
          path={splat}
          mode="blob"
        />
      </Suspend>
    );
  },
});

const issuesRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/issues',
  component: function IssuesRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    return (
      <Suspend>
        <IssuesListPage owner={owner} name={name} />
      </Suspend>
    );
  },
});

const issueDetailRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/issues/$number',
  component: function IssueDetailRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    const { number } = issueDetailRoute.useParams();
    return (
      <Suspend>
        <IssueDetailPage
          owner={owner}
          name={name}
          number={Number(number)}
        />
      </Suspend>
    );
  },
});

const pullsRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/pulls',
  component: function PullsRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    return (
      <Suspend>
        <PullsListPage owner={owner} name={name} />
      </Suspend>
    );
  },
});

const pullDetailRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/pull/$number',
  component: function PullDetailRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    const { number } = pullDetailRoute.useParams();
    return (
      <Suspend>
        <PullDetailPage
          owner={owner}
          name={name}
          number={Number(number)}
          tab="conversation"
        />
      </Suspend>
    );
  },
});

const pullFilesRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/pull/$number/files',
  component: function PullFilesRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    const { number } = pullFilesRoute.useParams();
    return (
      <Suspend>
        <PullDetailPage
          owner={owner}
          name={name}
          number={Number(number)}
          tab="files"
        />
      </Suspend>
    );
  },
});

// github: /pulls list + /pull/:n conversation + /pull/:n/files
const routeTree = rootRoute.addChildren([
  indexRoute,
  searchRoute,
  repoLayoutRoute.addChildren([
    repoIndexRoute,
    treeRoute,
    blobRoute,
    issuesRoute,
    issueDetailRoute,
    pullsRoute,
    pullDetailRoute,
    pullFilesRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
