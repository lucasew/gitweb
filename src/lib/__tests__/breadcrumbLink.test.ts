import { describe, expect, it } from 'vitest';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { appPathForObject } from '@/lib/repoPath';

function makeRouter(initialPath: string) {
  const rootRoute = createRootRoute({ component: () => null });
  const repoLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/$owner/$name',
    component: () => null,
  });
  const repoIndex = createRoute({
    getParentRoute: () => repoLayoutRoute,
    path: '/',
    component: () => null,
  });
  const treeRootRoute = createRoute({
    getParentRoute: () => repoLayoutRoute,
    path: '/tree/$ref',
    component: () => null,
  });
  const treeRoute = createRoute({
    getParentRoute: () => repoLayoutRoute,
    path: '/tree/$ref/$',
    component: () => null,
  });
  const blobRoute = createRoute({
    getParentRoute: () => repoLayoutRoute,
    path: '/blob/$ref/$',
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([
    repoLayoutRoute.addChildren([
      repoIndex,
      treeRootRoute,
      treeRoute,
      blobRoute,
    ]),
  ]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

describe('file-view breadcrumb branch link', () => {
  it('absolute tree root from blob clears file path', async () => {
    const router = makeRouter('/o/r/blob/main/src/App.tsx');
    await router.load();

    const href = appPathForObject('o', 'r', 'main', '', 'tree');
    expect(href).toBe('/o/r/tree/main');

    await router.navigate({ to: href });
    await router.load();

    expect(router.state.location.pathname).toBe('/o/r/tree/main');
    expect(
      (router.state.matches.at(-1)?.params as { _splat?: string })._splat ?? '',
    ).toBe('');
  });

  it('typed splat without clearing inherits blob path (the bug)', async () => {
    const router = makeRouter('/o/r/blob/main/src/App.tsx');
    await router.load();
    const loc = router.buildLocation({
      to: '/$owner/$name/tree/$ref/$',
      params: { owner: 'o', name: 'r', ref: 'main' },
    });
    expect(loc.pathname).toBe('/o/r/tree/main/src/App.tsx');
  });
});
