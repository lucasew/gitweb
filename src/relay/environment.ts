import {
  Environment,
  Network,
  RecordSource,
  Store,
  type FetchFunction,
  type GraphQLResponse,
} from 'relay-runtime';
import { clearToken, getToken } from '@/lib/auth';

export const DEFAULT_GRAPHQL_URL = 'https://api.github.com/graphql';

export type RateLimitSnapshot = {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
  resource: string | null;
};

type RateLimitListener = (s: RateLimitSnapshot) => void;

let rateLimit: RateLimitSnapshot = {
  limit: null,
  remaining: null,
  reset: null,
  resource: null,
};
const listeners = new Set<RateLimitListener>();

export function getRateLimit(): RateLimitSnapshot {
  return rateLimit;
}

export function subscribeRateLimit(fn: RateLimitListener): () => void {
  listeners.add(fn);
  fn(rateLimit);
  return () => listeners.delete(fn);
}

function setRateLimit(next: RateLimitSnapshot) {
  rateLimit = next;
  for (const fn of listeners) fn(next);
}

function parseRateHeaders(headers: Headers): void {
  const limit = headers.get('X-RateLimit-Limit');
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');
  const resource = headers.get('X-RateLimit-Resource');
  if (limit || remaining || reset) {
    setRateLimit({
      limit: limit ? Number(limit) : null,
      remaining: remaining ? Number(remaining) : null,
      reset: reset ? Number(reset) : null,
      resource,
    });
  }
}

export type GitHubClientOptions = {
  baseUrl?: string;
  getAccessToken?: () => string | null;
};

function createFetch(opts: GitHubClientOptions = {}): FetchFunction {
  const baseUrl = opts.baseUrl ?? DEFAULT_GRAPHQL_URL;
  const getAccessToken = opts.getAccessToken ?? getToken;

  return (params, variables): Promise<GraphQLResponse> => {
    const token = getAccessToken();
    if (!token) {
      return Promise.reject(
        new Error('Not signed in: paste a GitHub PAT first.'),
      );
    }

    return fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Github-Next-Global-ID': '1',
      },
      body: JSON.stringify({
        query: params.text,
        variables,
      }),
    }).then(async (res) => {
      parseRateHeaders(res.headers);

      if (res.status === 401) {
        clearToken();
        throw new Error(
          'GitHub returned 401 Unauthorized. Token invalid or revoked — paste a new PAT.',
        );
      }

      if (res.status === 403) {
        const body = await res.text();
        throw new Error(
          `GitHub 403 (rate limit or forbidden). ${body.slice(0, 500)}`,
        );
      }

      const json = (await res.json()) as {
        data?: Record<string, unknown> | null;
        errors?: { message?: string; type?: string }[];
      };

      if (!res.ok) {
        throw new Error(`GitHub HTTP ${res.status}: ${res.statusText}`);
      }

      if (json.errors?.length) {
        const unique = [
          ...new Set(json.errors.map((e) => e.message ?? 'error')),
        ];
        const msg = unique.join('; ');
        const resourceLimited = unique.some((m) =>
          /resource limits/i.test(m),
        );
        const isMutation = params.operationKind === 'mutation';
        const dataObj =
          json.data && typeof json.data === 'object' ? json.data : null;
        // GitHub often returns { data: { addPullRequestReview: null }, errors: [...] }
        // — that must fail so Relay calls onError (not a fake onCompleted success).
        const mutationPayloadMissing =
          isMutation &&
          dataObj != null &&
          Object.values(dataObj).every((v) => v == null);

        if (isMutation || mutationPayloadMissing || json.data == null) {
          throw new Error(
            resourceLimited
              ? `GitHub GraphQL query too expensive (resource limits). ${msg}`
              : msg,
          );
        }
        if (resourceLimited) {
          console.warn('GitHub GraphQL resource limits (partial data):', msg);
        }
      }

      return json as GraphQLResponse;
    });
  };
}

export function createRelayEnvironment(
  opts: GitHubClientOptions = {},
): Environment {
  return new Environment({
    network: Network.create(createFetch(opts)),
    store: new Store(new RecordSource(), {
      gcReleaseBufferSize: 20,
    }),
  });
}
