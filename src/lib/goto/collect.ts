import { defaultProviders } from './providers';
import type { GotoCandidate, GotoContext, GotoProvider } from './types';

const GROUP_ORDER = [
  'Go to path',
  'This repository',
  'Jump',
  'Repositories',
  'Navigate',
  'Search',
];

/**
 * Run all goto providers, sort by group + priority, dedupe by id/action.
 */
export function collectGotoCandidates(
  query: string,
  ctx: GotoContext,
  providers: GotoProvider[] = defaultProviders,
): GotoCandidate[] {
  const q = query.trim();
  const raw = providers.flatMap((p) => p(q, ctx));

  raw.sort((a, b) => {
    const ga = GROUP_ORDER.indexOf(a.group);
    const gb = GROUP_ORDER.indexOf(b.group);
    const g =
      (ga === -1 ? 99 : ga) - (gb === -1 ? 99 : gb);
    if (g !== 0) return g;
    return a.priority - b.priority;
  });

  const seen = new Set<string>();
  return raw.filter((c) => {
    const key =
      c.action.kind === 'navigate'
        ? `nav:${c.action.to}`
        : `path:${c.action.owner}/${c.action.name}@${c.action.ref}:${c.action.path}`;
    const idKey = `${key}::${c.id}`;
    if (seen.has(idKey)) return false;
    seen.add(idKey);
    return true;
  });
}

export function groupCandidates(
  items: GotoCandidate[],
): Record<string, GotoCandidate[]> {
  const out: Record<string, GotoCandidate[]> = {};
  for (const item of items) {
    (out[item.group] ??= []).push(item);
  }
  // preserve group order
  const ordered: Record<string, GotoCandidate[]> = {};
  for (const g of GROUP_ORDER) {
    if (out[g]?.length) ordered[g] = out[g]!;
  }
  for (const [g, list] of Object.entries(out)) {
    if (!ordered[g]) ordered[g] = list;
  }
  return ordered;
}
