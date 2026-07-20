import { useCallback, useEffect, useRef, useState } from 'react';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { STORE_AND_NETWORK } from '@/lib/relayPolicy';
import { Link } from '@tanstack/react-router';
import { GitCommitHorizontal } from 'lucide-react';
import type { CommitDetailPageQuery } from './__generated__/CommitDetailPageQuery.graphql';
import { AuthorByline } from '@/components/AuthorByline';
import { ExternalLink } from '@/components/ExternalLink';
import { FilesDiffList } from '@/components/FilesDiffList';
import { ErrorBanner } from '@/components/ErrorBanner';
import { LoadingBlock } from '@/components/LoadingBlock';
import { fetchCommit, type RestCommitDetail } from '@/lib/rest';

const query = graphql`
  query CommitDetailPageQuery(
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
          oid
          abbreviatedOid
          message
          messageHeadline
          committedDate
          authoredDate
          url
          author {
            name
            email
            avatarUrl(size: 48)
            user {
              login
              name
              avatarUrl(size: 48)
            }
          }
          committer {
            name
            email
            avatarUrl(size: 48)
            user {
              login
              name
            }
          }
          parents(first: 5) {
            nodes {
              oid
              abbreviatedOid
              messageHeadline
            }
          }
        }
      }
    }
  }
`;

type Props = { owner: string; name: string; sha: string };

export function CommitDetailPage({ owner, name, sha }: Props) {
  const data = useLazyLoadQuery<CommitDetailPageQuery>(
    query,
    { owner, name, expression: sha },
    STORE_AND_NETWORK,
  );
  const repo = data.repository;
  const commit =
    repo?.object?.__typename === 'Commit' ? repo.object : null;

  const [rest, setRest] = useState<RestCommitDetail | null>(null);
  const [restErr, setRestErr] = useState<string | null>(null);
  const [restLoading, setRestLoading] = useState(true);
  /** Monotonic id so late REST responses from a prior SHA/retry are ignored. */
  const fetchSeq = useRef(0);

  const loadRest = useCallback(() => {
    const seq = ++fetchSeq.current;
    setRestLoading(true);
    setRestErr(null);
    // Drop prior commit files while the new SHA loads (avoid flashing wrong diffs).
    setRest(null);
    void fetchCommit(owner, name, sha)
      .then((c) => {
        if (seq === fetchSeq.current) setRest(c);
      })
      .catch((e: unknown) => {
        if (seq === fetchSeq.current)
          setRestErr(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (seq === fetchSeq.current) setRestLoading(false);
      });
  }, [owner, name, sha]);

  useEffect(() => {
    loadRest();
    return () => {
      // Invalidate in-flight work when SHA changes or the page unmounts.
      fetchSeq.current += 1;
    };
  }, [loadRest]);

  if (!repo || !commit) {
    return (
      <div className="p-4 alert alert-warning">
        Commit not found: <code className="text-xs">{sha}</code>
      </div>
    );
  }

  const login = commit.author?.user?.login ?? null;
  const authorName = commit.author?.user?.name ?? commit.author?.name ?? null;
  const avatar =
    commit.author?.user?.avatarUrl ?? commit.author?.avatarUrl ?? null;
  const parents = commit.parents?.nodes?.filter(Boolean) ?? [];
  const body = commit.message.includes('\n')
    ? commit.message.slice(commit.message.indexOf('\n') + 1).trim()
    : '';

  return (
    <div className="w-full min-w-0 p-[clamp(0.75rem,2vw,1.25rem)]">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="border border-base-300 rounded-box p-3 space-y-2 bg-base-100">
          <div className="flex flex-wrap items-start gap-2">
            <GitCommitHorizontal
              className="size-5 shrink-0 opacity-60 mt-0.5"
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-lg font-semibold break-words">
                {commit.messageHeadline}
              </h1>
              {body ? (
                <pre className="text-sm whitespace-pre-wrap font-sans opacity-80">
                  {body}
                </pre>
              ) : null}
            </div>
            <ExternalLink
              className="btn btn-ghost btn-sm shrink-0"
              href={commit.url || `${repo.url}/commit/${commit.oid}`}
            >
              GitHub
            </ExternalLink>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <AuthorByline
              className="min-w-0 !w-auto max-w-xs"
              author={{
                login: login ?? authorName ?? 'unknown',
                avatarUrl: avatar,
                name: authorName,
              }}
              meta={new Date(commit.committedDate).toLocaleString()}
            />
            <Link
              to="/$owner/$name/commit/$sha"
              params={{ owner, name, sha: commit.oid }}
              className="font-mono text-xs link link-hover tabular-nums"
              title={commit.oid}
            >
              {commit.abbreviatedOid}
            </Link>
            {parents.length > 0 ? (
              <span className="text-xs opacity-60 flex flex-wrap items-center gap-1">
                parent
                {parents.length > 1 ? 's' : ''}:
                {parents.map((p) =>
                  p ? (
                    <Link
                      key={p.oid}
                      to="/$owner/$name/commit/$sha"
                      params={{ owner, name, sha: p.oid }}
                      className="font-mono link link-hover"
                      title={p.messageHeadline}
                    >
                      {p.abbreviatedOid}
                    </Link>
                  ) : null,
                )}
              </span>
            ) : null}
            {parents[0] ? (
              <Link
                to="/$owner/$name/compare/$"
                params={{
                  owner,
                  name,
                  _splat: `${parents[0].oid}...${commit.oid}`,
                }}
                className="link text-xs"
              >
                compare to parent
              </Link>
            ) : null}
          </div>
          {rest?.stats ? (
            <div className="text-xs tabular-nums opacity-70">
              <span className="text-success">+{rest.stats.additions}</span>
              {' / '}
              <span className="text-error">−{rest.stats.deletions}</span>
            </div>
          ) : null}
        </div>

        {restLoading ? <LoadingBlock label="Loading diffs…" /> : null}
        {restErr ? (
          <ErrorBanner
            title="Could not load commit files (REST)"
            detail={restErr}
            onRetry={loadRest}
          />
        ) : null}
        {rest && !restLoading ? (
          <FilesDiffList
            files={rest.files ?? []}
            owner={owner}
            name={name}
            headRef={commit.oid}
            githubFilesUrl={rest.html_url}
          />
        ) : null}
      </div>
    </div>
  );
}
