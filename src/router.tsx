import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { Suspense, lazy, useState, type ReactNode } from 'react';
import { SimpleErrorBoundary } from '@/components/SimpleErrorBoundary';
import { TopBar } from '@/components/TopBar';
import { CommandPalette } from '@/components/CommandPalette';
import { LoadingBlock } from '@/components/LoadingBlock';
import { PagePending } from '@/components/PagePending';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { STORE_AND_NETWORK } from '@/lib/relayPolicy';
import type { routerViewerQuery } from './__generated__/routerViewerQuery.graphql';

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
const ActionsListPage = lazy(() =>
  import('@/screens/ActionsListPage').then((m) => ({
    default: m.ActionsListPage,
  })),
);
const ActionsRunPage = lazy(() =>
  import('@/screens/ActionsRunPage').then((m) => ({
    default: m.ActionsRunPage,
  })),
);
const CommitsListPage = lazy(() =>
  import('@/screens/CommitsListPage').then((m) => ({
    default: m.CommitsListPage,
  })),
);
const CommitDetailPage = lazy(() =>
  import('@/screens/CommitDetailPage').then((m) => ({
    default: m.CommitDetailPage,
  })),
);
const ComparePage = lazy(() =>
  import('@/screens/ComparePage').then((m) => ({
    default: m.ComparePage,
  })),
);
const SearchPage = lazy(() =>
  import('@/screens/SearchPage').then((m) => ({ default: m.SearchPage })),
);
const UserPage = lazy(() =>
  import('@/screens/UserPage').then((m) => ({ default: m.UserPage })),
);

const viewerQuery = graphql`
  query routerViewerQuery {
    viewer {
      login
      avatarUrl
    }
  }
`;

function ViewerChrome({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="h-dvh flex items-center justify-center">
          <LoadingBlock label="Loading session…" />
        </div>
      }
    >
      <ViewerChromeInner>{children}</ViewerChromeInner>
    </Suspense>
  );
}

function ViewerChromeInner({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Reuse viewer record across navigations (no full remount suspend)
  const viewer = useLazyLoadQuery<routerViewerQuery>(
    viewerQuery,
    {},
    STORE_AND_NETWORK,
  );

  return (
    <div className="h-dvh max-h-dvh flex flex-col w-full min-w-0 overflow-hidden">
      <TopBar
        onOpenPalette={() => setPaletteOpen(true)}
        viewerLogin={viewer.viewer.login}
        viewerAvatarUrl={viewer.viewer.avatarUrl}
        signedIn
        onSignedOut={() => {
          window.location.href = '/';
        }}
      />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <main className="flex-1 min-h-0 min-w-0 overflow-auto w-full flex flex-col relative">
        {/*
          Outer Suspense: with startTransition navigations React keeps the
          previous page painted; this fallback is only a thin bar, not a blank.
        */}
        <Suspense fallback={<PagePending />}>
          <SimpleErrorBoundary className="flex-1 min-h-0 min-w-0 flex flex-col">
            {children}
          </SimpleErrorBoundary>
        </Suspense>
      </main>
    </div>
  );
}

function Suspend({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 min-h-0 flex flex-col">
          <PagePending />
          <div className="flex-1 flex items-center justify-center p-4 opacity-40">
            <LoadingBlock />
          </div>
        </div>
      }
    >
      <div className="flex-1 min-h-0 min-w-0 flex flex-col">{children}</div>
    </Suspense>
  );
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

/** User / org profile — single segment so it does not clash with `/$owner/$name`. */
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$login',
  component: function UserRoute() {
    const { login } = userRoute.useParams();
    return (
      <ViewerChrome>
        <Suspend>
          <UserPage login={login} />
        </Suspend>
      </ViewerChrome>
    );
  },
});

const repoLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$owner/$name',
  component: function RepoLayout() {
    return (
      <ViewerChrome>
        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
          <Outlet />
        </div>
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

/** Tree at ref root (no path segments) — e.g. /owner/repo/tree/main */
const treeRootRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/tree/$ref',
  component: function TreeRootRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    const { ref } = treeRootRoute.useParams();
    return (
      <Suspend>
        <CodeBrowserPage
          owner={owner}
          name={name}
          refName={ref}
          path=""
          mode="tree"
        />
      </Suspend>
    );
  },
});

/** Tree under a path — e.g. /owner/repo/tree/main/src/lib */
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
        <IssueDetailPage owner={owner} name={name} number={Number(number)} />
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

const actionsRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/actions',
  component: function ActionsRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    return (
      <Suspend>
        <ActionsListPage owner={owner} name={name} />
      </Suspend>
    );
  },
});

const actionsRunRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/actions/runs/$runId',
  component: function ActionsRunRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    const { runId } = actionsRunRoute.useParams();
    return (
      <Suspend>
        <ActionsRunPage
          owner={owner}
          name={name}
          runId={decodeURIComponent(runId)}
        />
      </Suspend>
    );
  },
});

const commitsListRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/commits/$ref',
  component: function CommitsListRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    const { ref } = commitsListRoute.useParams();
    return (
      <Suspend>
        <CommitsListPage owner={owner} name={name} refName={ref} />
      </Suspend>
    );
  },
});

const commitDetailRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/commit/$sha',
  component: function CommitDetailRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    const { sha } = commitDetailRoute.useParams();
    return (
      <Suspend>
        <CommitDetailPage owner={owner} name={name} sha={sha} />
      </Suspend>
    );
  },
});

/** GitHub-like compare: /compare/base...head (splat holds full range) */
const compareRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/compare/$',
  component: function CompareRoute() {
    const { owner, name } = repoLayoutRoute.useParams();
    const range = compareRoute.useParams()._splat ?? '';
    const sep = range.indexOf('...');
    const base = sep >= 0 ? range.slice(0, sep) : range;
    const head = sep >= 0 ? range.slice(sep + 3) : '';
    if (!base || !head) {
      return (
        <div className="p-4 alert alert-warning text-sm">
          Compare needs <code>base...head</code> in the path.
        </div>
      );
    }
    return (
      <Suspend>
        <ComparePage owner={owner} name={name} base={base} head={head} />
      </Suspend>
    );
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  searchRoute,
  userRoute,
  repoLayoutRoute.addChildren([
    repoIndexRoute,
    treeRootRoute,
    treeRoute,
    blobRoute,
    commitsListRoute,
    commitDetailRoute,
    compareRoute,
    issuesRoute,
    issueDetailRoute,
    pullsRoute,
    pullDetailRoute,
    pullFilesRoute,
    actionsRoute,
    actionsRunRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  /** Avoid flashing pending UI for instant cache hits */
  defaultPendingMs: 200,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
