import {
  fetchQuery,
  graphql,
  useLazyLoadQuery,
  useMutation,
  useRelayEnvironment,
} from 'react-relay';
import { lazy, Suspense, useState } from 'react';
import { Link } from '@tanstack/react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PullDetailPageQuery } from './__generated__/PullDetailPageQuery.graphql';
import type { PullDetailPageMergeMutation } from './__generated__/PullDetailPageMergeMutation.graphql';
import type { PullDetailPageCloseMutation } from './__generated__/PullDetailPageCloseMutation.graphql';
import type { PullDetailPageReviewMutation } from './__generated__/PullDetailPageReviewMutation.graphql';
import { useToast } from '@/lib/toast';
import { useLiveQuery } from '@/lib/useLiveQuery';
import { LoadingBlock } from '@/components/LoadingBlock';
import { ExternalLink } from '@/components/ExternalLink';
import { AuthorByline } from '@/components/AuthorByline';
import { PrStateBadge } from '@/components/PrStateBadge';

const PullFilesDiff = lazy(() =>
  import('@/components/PullFilesDiff').then((m) => ({
    default: m.PullFilesDiff,
  })),
);

const query = graphql`
  query PullDetailPageQuery($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      mergeCommitAllowed
      squashMergeAllowed
      rebaseMergeAllowed
      viewerDefaultMergeMethod
      pullRequest(number: $number) {
        id
        number
        title
        body
        state
        isDraft
        merged
        mergeable
        url
        createdAt
        author {
          login
          avatarUrl(size: 64)
          ... on User {
            name
          }
        }
        baseRefName
        headRefName
        reviews(first: 20) {
          nodes {
            id
            state
            author {
              login
              avatarUrl(size: 40)
              ... on User {
                name
              }
            }
            body
            createdAt
          }
        }
        comments(first: 40) {
          nodes {
            id
            body
            createdAt
            author {
              login
              avatarUrl(size: 40)
              ... on User {
                name
              }
            }
          }
        }
        reviewThreads(first: 80) {
          nodes {
            id
            path
            line
            startLine
            diffSide
            isResolved
            comments(first: 20) {
              nodes {
                id
                body
                author {
                  login
                }
              }
            }
          }
        }
      }
    }
  }
`;

const mergeMutation = graphql`
  mutation PullDetailPageMergeMutation(
    $id: ID!
    $mergeMethod: PullRequestMergeMethod!
  ) {
    mergePullRequest(
      input: { pullRequestId: $id, mergeMethod: $mergeMethod }
    ) {
      pullRequest {
        id
        state
        merged
        mergeable
      }
    }
  }
`;

const closeMutation = graphql`
  mutation PullDetailPageCloseMutation($id: ID!) {
    closePullRequest(input: { pullRequestId: $id }) {
      pullRequest {
        id
        state
        merged
      }
    }
  }
`;

const reviewMutation = graphql`
  mutation PullDetailPageReviewMutation(
    $id: ID!
    $event: PullRequestReviewEvent!
    $body: String
  ) {
    addPullRequestReview(
      input: { pullRequestId: $id, event: $event, body: $body }
    ) {
      pullRequestReview {
        id
        state
        body
        createdAt
        author {
          login
        }
      }
    }
  }
`;

export type PullTab = 'conversation' | 'files';

type Props = {
  owner: string;
  name: string;
  number: number;
  /** Deep-linked tab: `/pull/:n` or `/pull/:n/files` */
  tab?: PullTab;
};
type MergeMethod = 'MERGE' | 'SQUASH' | 'REBASE';

const MERGE_LABELS: Record<MergeMethod, string> = {
  MERGE: 'Create a merge commit',
  SQUASH: 'Squash and merge',
  REBASE: 'Rebase and merge',
};

const MERGE_SHORT: Record<MergeMethod, string> = {
  MERGE: 'Merge',
  SQUASH: 'Squash',
  REBASE: 'Rebase',
};

export function PullDetailPage({
  owner,
  name,
  number,
  tab = 'conversation',
}: Props) {
  const toast = useToast();
  const env = useRelayEnvironment();
  const variables = { owner, name, number };
  const data = useLazyLoadQuery<PullDetailPageQuery>(query, variables, {
    fetchPolicy: 'store-and-network',
  });
  useLiveQuery(query, variables);

  const refresh = () => {
    void fetchQuery(env, query, variables, {
      fetchPolicy: 'network-only',
    }).toPromise();
  };

  const repo = data.repository;
  const pr = repo?.pullRequest;
  const [reviewBody, setReviewBody] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergeMethod, setMergeMethod] = useState<MergeMethod | null>(null);

  const [commitMerge, mergeInFlight] =
    useMutation<PullDetailPageMergeMutation>(mergeMutation);
  const [commitClose, closeInFlight] =
    useMutation<PullDetailPageCloseMutation>(closeMutation);
  const [commitReview, reviewInFlight] =
    useMutation<PullDetailPageReviewMutation>(reviewMutation);

  if (!pr) {
    return (
      <div className="p-4 alert alert-warning">Pull request not found</div>
    );
  }

  const threads =
    pr.reviewThreads?.nodes
      ?.filter(Boolean)
      .map((n) => ({
        id: n!.id,
        path: n!.path,
        line: n!.line ?? null,
        startLine: n!.startLine ?? null,
        diffSide: n!.diffSide as 'LEFT' | 'RIGHT',
        isResolved: n!.isResolved,
        comments:
          n!.comments?.nodes
            ?.filter(Boolean)
            .map((c) => ({
              id: c!.id,
              body: c!.body,
              authorLogin: c!.author?.login ?? null,
            })) ?? [],
      })) ?? [];

  const canReview = !pr.merged && pr.state === 'OPEN';

  const allowedMethods: MergeMethod[] = (
    [
      repo?.mergeCommitAllowed ? 'MERGE' : null,
      repo?.squashMergeAllowed ? 'SQUASH' : null,
      repo?.rebaseMergeAllowed ? 'REBASE' : null,
    ] as const
  ).filter((m): m is MergeMethod => m != null);

  const defaultMethod: MergeMethod =
    (repo?.viewerDefaultMergeMethod as MergeMethod | undefined) &&
    allowedMethods.includes(repo.viewerDefaultMergeMethod as MergeMethod)
      ? (repo.viewerDefaultMergeMethod as MergeMethod)
      : (allowedMethods[0] ?? 'MERGE');

  const activeMergeMethod = mergeMethod ?? defaultMethod;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)] w-full">
      <div className="p-3 md:p-4 space-y-3 flex-1 pb-24 w-full">
        {/* Header + tabs: always full content width (same on conversation and files) */}
        <div className="flex items-start gap-2 w-full">
          <h1 className="text-xl font-semibold min-w-0 flex-1">
            {pr.title}{' '}
            <span className="opacity-50 font-normal">#{pr.number}</span>
          </h1>
          <PrStateBadge
            className="shrink-0"
            state={pr.state}
            merged={pr.merged}
            isDraft={pr.isDraft}
            merging={merging || mergeInFlight}
          />
        </div>
        <div className="text-xs opacity-60 font-mono">
          {pr.headRefName} → {pr.baseRefName}
        </div>

        <div role="tablist" className="tabs tabs-bordered w-full">
          <Link
            role="tab"
            to="/$owner/$name/pull/$number"
            params={{ owner, name, number: String(number) }}
            className={`tab ${tab === 'conversation' ? 'tab-active' : ''}`}
            aria-selected={tab === 'conversation'}
          >
            Conversation
          </Link>
          <Link
            role="tab"
            to="/$owner/$name/pull/$number/files"
            params={{ owner, name, number: String(number) }}
            className={`tab ${tab === 'files' ? 'tab-active' : ''}`}
            aria-selected={tab === 'files'}
          >
            Files
          </Link>
        </div>

        {tab === 'files' ? (
          <Suspense fallback={<LoadingBlock label="Loading diffs…" />}>
            <PullFilesDiff
              owner={owner}
              name={name}
              number={number}
              pullRequestId={pr.id}
              canReview={canReview}
              threads={threads}
              onThreadsChanged={refresh}
            />
          </Suspense>
        ) : (
          <div className="max-w-3xl w-full mx-auto space-y-3">
            <div className="border border-base-300 rounded-box p-3">
              <div className="mb-2">
                <AuthorByline
                  size="md"
                  author={
                    pr.author
                      ? {
                          login: pr.author.login,
                          avatarUrl: pr.author.avatarUrl,
                          name:
                            pr.author && 'name' in pr.author
                              ? (pr.author as { name?: string | null }).name
                              : null,
                        }
                      : null
                  }
                  meta={new Date(pr.createdAt).toLocaleString()}
                />
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {pr.body || '_No description_'}
                </ReactMarkdown>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium opacity-60 mb-1">Reviews</div>
              <ul className="space-y-1 mb-3">
                {pr.reviews?.nodes?.map((r) =>
                  r ? (
                    <li key={r.id} className="text-xs border border-base-300 rounded p-2 space-y-1">
                      <AuthorByline
                        author={
                          r.author
                            ? {
                                login: r.author.login,
                                avatarUrl: r.author.avatarUrl,
                                name:
                                  r.author && 'name' in r.author
                                    ? (r.author as { name?: string | null }).name
                                    : null,
                              }
                            : null
                        }
                        meta={r.state}
                      />
                      {r.body ? (
                        <div className="prose prose-sm max-w-none mt-1">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {r.body}
                          </ReactMarkdown>
                        </div>
                      ) : null}
                    </li>
                  ) : null,
                )}
              </ul>
            </div>

            {pr.comments?.nodes?.map((c) => {
              if (!c) return null;
              return (
                <div
                  key={c.id}
                  className="border border-base-300 rounded-box p-3"
                >
                  <div className="mb-2">
                    <AuthorByline
                      author={
                        c.author
                          ? {
                              login: c.author.login,
                              avatarUrl: c.author.avatarUrl,
                              name:
                                c.author && 'name' in c.author
                                  ? (c.author as { name?: string | null }).name
                                  : null,
                            }
                          : null
                      }
                      meta={new Date(c.createdAt).toLocaleString()}
                    />
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {c.body}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            })}

            {!pr.merged && pr.state === 'OPEN' ? (
              <div className="space-y-2 border border-base-300 rounded-box p-3">
                <div className="text-sm font-medium">Submit review</div>
                <textarea
                  className="textarea textarea-bordered w-full min-h-20"
                  placeholder="Optional review body"
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['APPROVE', 'Approve'],
                      ['COMMENT', 'Comment'],
                      ['REQUEST_CHANGES', 'Request changes'],
                    ] as const
                  ).map(([event, label]) => (
                    <button
                      key={event}
                      type="button"
                      className="btn btn-sm"
                      disabled={reviewInFlight}
                      onClick={() => {
                        commitReview({
                          variables: {
                            id: pr.id,
                            event,
                            body: reviewBody.trim() || null,
                          },
                          onCompleted: () => {
                            setReviewBody('');
                            toast.info(`Review: ${label}`);
                            refresh();
                          },
                          onError: (e) =>
                            toast.error('Review failed', e.message),
                        });
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-base-300 bg-base-100 p-2 flex flex-wrap gap-2 items-center w-full">
        {!pr.merged && pr.state === 'OPEN' ? (
          <>
            {allowedMethods.length > 0 ? (
              <label className="flex items-center gap-1 text-xs">
                <span className="opacity-60 hidden sm:inline">Strategy</span>
                <select
                  className="select select-bordered select-sm max-w-[14rem]"
                  value={activeMergeMethod}
                  disabled={mergeInFlight || merging}
                  onChange={(e) =>
                    setMergeMethod(e.target.value as MergeMethod)
                  }
                  aria-label="Merge strategy"
                >
                  {allowedMethods.map((m) => (
                    <option key={m} value={m}>
                      {MERGE_LABELS[m]}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="text-xs opacity-60">No merge methods enabled</span>
            )}
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={
                mergeInFlight ||
                merging ||
                pr.mergeable === 'CONFLICTING' ||
                allowedMethods.length === 0
              }
              onClick={() => {
                setMerging(true);
                commitMerge({
                  variables: {
                    id: pr.id,
                    mergeMethod: activeMergeMethod,
                  },
                  optimisticResponse: {
                    mergePullRequest: {
                      pullRequest: {
                        id: pr.id,
                        state: 'OPEN',
                        merged: false,
                        mergeable: pr.mergeable,
                      },
                    },
                  },
                  onCompleted: (res) => {
                    setMerging(false);
                    if (res.mergePullRequest?.pullRequest?.merged) {
                      toast.info(`Merged (${MERGE_SHORT[activeMergeMethod]})`);
                    } else {
                      toast.info('Merge completed');
                    }
                  },
                  onError: (e) => {
                    setMerging(false);
                    toast.error('Merge failed', e.message);
                  },
                });
              }}
            >
              {mergeInFlight || merging
                ? 'Merging…'
                : MERGE_SHORT[activeMergeMethod]}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              disabled={closeInFlight}
              onClick={() => {
                commitClose({
                  variables: { id: pr.id },
                  optimisticResponse: {
                    closePullRequest: {
                      pullRequest: {
                        id: pr.id,
                        state: 'CLOSED',
                        merged: false,
                      },
                    },
                  },
                  onError: (e) => toast.error('Close failed', e.message),
                });
              }}
            >
              Close
            </button>
          </>
        ) : null}
        <ExternalLink className="btn btn-sm btn-ghost ml-auto" href={pr.url}>
          GitHub
        </ExternalLink>
      </div>
    </div>
  );
}
