import { describe, expect, it } from 'vitest';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

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
  const actionsRoute = createRoute({
    getParentRoute: () => repoLayoutRoute,
    path: '/actions',
    component: () => null,
  });
  const actionsRunRoute = createRoute({
    getParentRoute: () => repoLayoutRoute,
    path: '/actions/runs/$runId',
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([
    repoLayoutRoute.addChildren([repoIndex, actionsRoute, actionsRunRoute]),
  ]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

describe('actions routes', () => {
  it('matches /owner/repo/actions', async () => {
    const router = makeRouter('/ReVanced/revanced-manager/actions');
    await router.load();
    const last = router.state.matches.at(-1);
    expect(last?.routeId).toContain('actions');
    expect((last?.params as { owner?: string }).owner).toBe('ReVanced');
    expect((last?.params as { name?: string }).name).toBe('revanced-manager');
  });
});
