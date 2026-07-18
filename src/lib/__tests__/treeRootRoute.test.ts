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

describe('tree at commit/branch root', () => {
  const sha = 'c5de9d90c128b77ddc31d9f55b1de5c65d6ab339';

  it('matches a tree route for /owner/repo/tree/<sha>', async () => {
    const path = appPathForObject('fetchurl', 'sdk-rust', sha, '', 'tree');
    expect(path).toBe(`/fetchurl/sdk-rust/tree/${sha}`);
    const router = makeRouter(path);
    await router.load();
    const last = router.state.matches.at(-1);
    expect(router.state.matches.length).toBeGreaterThan(0);
    expect(last?.routeId).toMatch(/tree/);
    expect((last?.params as { ref?: string }).ref).toBe(sha);
  });

  it('matches tree/main', async () => {
    const router = makeRouter('/o/r/tree/main');
    await router.load();
    const last = router.state.matches.at(-1);
    expect(last?.routeId).toMatch(/tree/);
    expect((last?.params as { ref?: string }).ref).toBe('main');
  });
});
