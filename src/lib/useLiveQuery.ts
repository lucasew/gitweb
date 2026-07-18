import { useEffect, useRef } from 'react';
import {
  fetchQuery,
  useRelayEnvironment,
  type GraphQLTaggedNode,
} from 'react-relay';
import type { Variables } from 'relay-runtime';

const DETAIL_POLL_MS = 45_000;

/**
 * Focus refetch + slow poll for open issue/PR conversation screens.
 * Does not fetch on mount (caller already has data via useLazyLoadQuery).
 */
export function useLiveQuery(
  query: GraphQLTaggedNode,
  variables: Variables,
  enabled = true,
): void {
  const env = useRelayEnvironment();
  const varsRef = useRef(variables);
  varsRef.current = variables;

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      void fetchQuery(env, query, varsRef.current, {
        fetchPolicy: 'network-only',
      }).toPromise();
    };

    const onFocus = () => {
      if (document.visibilityState === 'visible') run();
    };

    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') run();
    }, DETAIL_POLL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
      window.clearInterval(id);
    };
  }, [env, query, enabled]);
}
