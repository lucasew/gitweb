import { graphql, useLazyLoadQuery, usePaginationFragment } from 'react-relay';
import { STORE_AND_NETWORK } from '@/lib/relayPolicy';
import { Link } from '@tanstack/react-router';
import { GitCommitHorizontal } from 'lucide-react';
import { AuthorByline } from '@/components/AuthorByline';
import { ExternalLink } from '@/components/ExternalLink';
import type { CommitsListPageQuery } from './__generated__/CommitsListPageQuery.graphql';
import type { CommitsListPageHistoryFragment$key } from './__generated__/CommitsListPageHistoryFragment.graphql';

const historyFragment = graphql`
  fragment CommitsListPageHistoryFragment on Commit
  @refetchable(queryName: "CommitsListPageHistoryPaginationQuery")
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 30 }
  ) {
    history(first: $count, after: $cursor)
      @connection(key: "CommitsListPage_history") {
      edges {
        node {
          oid
          abbreviatedOid
          messageHeadline
          committedDate
          url
          author {
            name
            avatarUrl(size: 40)
            user {
              login
              name
              avatarUrl(size: 40)
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const query = graphql`
  query CommitsListPageQuery(
    $owner: String!
    $name: String!
    $expression: String!
  ) {
    repository(owner: $owner, name: $name) {
      nameWithOwner
      url
      object(expression: $expression) {
        __typename
        ... on Commit {
          ...CommitsListPageHistoryFragment
        }
      }
    }
  }
`;

type Props = { owner: string; name: string; refName: string };

function HistoryList({
  commitKey,
  owner,
  name,
}: {
  commitKey: CommitsListPageHistoryFragment$key;
  owner: string;
  name: string;
}) {
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(
    historyFragment,
    commitKey,
  );
  const edges = data.history?.edges ?? [];

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {edges.map((e) => {
          const c = e?.node;
          if (!c) return null;
          const login = c.author?.user?.login ?? null;
          const authorName = c.author?.user?.name ?? c.author?.name ?? null;
          const avatar =
            c.author?.user?.avatarUrl ?? c.author?.avatarUrl ?? null;
          return (
            <li key={c.oid}>
              <Link
                to="/$owner/$name/commit/$sha"
                params={{ owner, name, sha: c.oid }}
                className="block border border-base-300 rounded-box px-3 py-2 bg-base-100 hover:bg-base-200/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GitCommitHorizontal
                    className="size-4 shrink-0 opacity-60"
                    aria-hidden
                  />
                  <AuthorByline
                    className="min-w-0 flex-1"
                    author={{
                      login: login ?? authorName ?? 'unknown',
                      avatarUrl: avatar,
                      name: authorName,
                    }}
                    meta={new Date(c.committedDate).toLocaleString()}
                  />
                  <span className="font-mono text-xs opacity-70 tabular-nums shrink-0">
                    {c.abbreviatedOid}
                  </span>
                </div>
                <div className="ps-6 mt-1 text-sm font-medium break-words">
                  {c.messageHeadline}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {hasNext ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={isLoadingNext}
          onClick={() => loadNext(30)}
        >
          {isLoadingNext ? 'Loading…' : 'Load more'}
        </button>
      ) : null}
      {edges.length === 0 ? (
        <p className="text-sm opacity-50">No commits on this ref.</p>
      ) : null}
    </div>
  );
}

export function CommitsListPage({ owner, name, refName }: Props) {
  const data = useLazyLoadQuery<CommitsListPageQuery>(
    query,
    { owner, name, expression: refName },
    STORE_AND_NETWORK,
  );
  const repo = data.repository;
  const obj = repo?.object;

  if (!repo) {
    return (
      <div className="p-4 alert alert-warning">
        Repository not found: {owner}/{name}
      </div>
    );
  }

  if (!obj || obj.__typename !== 'Commit') {
    return (
      <div className="p-4 alert alert-warning">
        Not a commit ref: <code>{refName}</code>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 p-[clamp(0.75rem,2vw,1.25rem)]">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Commits</h1>
            <p className="text-sm opacity-60 font-mono">
              {repo.nameWithOwner} @ {refName}
            </p>
          </div>
          <ExternalLink
            className="btn btn-ghost btn-sm gap-1"
            href={`${repo.url}/commits/${encodeURIComponent(refName)}`}
          >
            GitHub
          </ExternalLink>
        </div>
        <HistoryList commitKey={obj} owner={owner} name={name} />
      </div>
    </div>
  );
}
