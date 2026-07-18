import {
  fetchQuery,
  graphql,
  useLazyLoadQuery,
  useMutation,
  useRelayEnvironment,
} from 'react-relay';
import { lazy, Suspense, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { PullDetailPageQuery } from './__generated__/PullDetailPageQuery.graphql';
import type { PullDetailPageMergeMutation } from './__generated__/PullDetailPageMergeMutation.graphql';
import type { PullDetailPageCloseMutation } from './__generated__/PullDetailPageCloseMutation.graphql';
import type { PullDetailPageReviewMutation } from './__generated__/PullDetailPageReviewMutation.graphql';
import type { PullDetailPageSubmitReviewMutation } from './__generated__/PullDetailPageSubmitReviewMutation.graphql';
import type { PullDetailPageDiscardReviewMutation } from './__generated__/PullDetailPageDiscardReviewMutation.graphql';
import { useToast } from '@/lib/toast';
import { useLiveQuery } from '@/lib/useLiveQuery';
import { LoadingBlock } from '@/components/LoadingBlock';
import { ExternalLink } from '@/components/ExternalLink';
import { AuthorByline } from '@/components/AuthorByline';
import { GithubMarkdown } from '@/components/GithubMarkdown';
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
        bodyHTML
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
        viewerLatestReview {
          id
          state
          body
          bodyHTML
        }
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
            bodyHTML
            createdAt
          }
        }
        comments(first: 40) {
          nodes {
            id
            body
            bodyHTML
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
                bodyHTML
                state
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

const submitReviewMutation = graphql`
  mutation PullDetailPageSubmitReviewMutation(
    $reviewId: ID!
    $event: PullRequestReviewEvent!
    $body: String
  ) {
    submitPullRequestReview(
      input: { pullRequestReviewId: $reviewId, event: $event, body: $body }
    ) {
      pullRequestReview {
        id
        state
        body
        bodyHTML
      }
    }
  }
`;

const discardReviewMutation = graphql`
  mutation PullDetailPageDiscardReviewMutation($reviewId: ID!) {
    deletePullRequestReview(input: { pullRequestReviewId: $reviewId }) {
      pullRequestReview {
        id
        state
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
  const [commitSubmitReview, submitInFlight] =
    useMutation<PullDetailPageSubmitReviewMutation>(submitReviewMutation);
  const [commitDiscardReview, discardInFlight] =
    useMutation<PullDetailPageDiscardReviewMutation>(discardReviewMutation);

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
              bodyHTML: c!.bodyHTML ?? null,
              state: c!.state ?? null,
              authorLogin: c!.author?.login ?? null,
            })) ?? [],
      })) ?? [];

  const canReview = !pr.merged && pr.state === 'OPEN';
  const pendingReview =
    pr.viewerLatestReview?.state === 'PENDING' ? pr.viewerLatestReview : null;

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
      <div className="w-full min-w-0 flex-1 space-y-3 p-[clamp(0.75rem,2vw,1.25rem)]">
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

        <div className="flex flex-wrap items-end gap-2 w-full min-w-0 border-b border-base-300">
          <div role="tablist" className="tabs tabs-bordered min-w-0 flex-1">
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

          <div className="flex flex-wrap items-center gap-1.5 shrink-0 ms-auto pb-1">
            {pendingReview ? (
              <span className="badge badge-warning badge-sm gap-1">
                Pending review
              </span>
            ) : null}

            {canReview ? (
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-sm btn-outline"
                >
                  Review
                  <span className="opacity-50 text-xs">▾</span>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow border border-base-300"
                >
                  {pendingReview ? (
                    <>
                      <li className="menu-title">
                        <span>Submit pending</span>
                      </li>
                      {(
                        [
                          ['APPROVE', 'Approve'],
                          ['COMMENT', 'Comment only'],
                          ['REQUEST_CHANGES', 'Request changes'],
                        ] as const
                      ).map(([event, label]) => (
                        <li key={event}>
                          <button
                            type="button"
                            disabled={submitInFlight}
                            onClick={() => {
                              commitSubmitReview({
                                variables: {
                                  reviewId: pendingReview.id,
                                  event,
                                  body: reviewBody.trim() || null,
                                },
                                onCompleted: () => {
                                  setReviewBody('');
                                  toast.info(`Review submitted: ${label}`);
                                  refresh();
                                },
                                onError: (e) =>
                                  toast.error('Submit review failed', e.message),
                              });
                            }}
                          >
                            {label}
                          </button>
                        </li>
                      ))}
                      <li>
                        <button
                          type="button"
                          className="text-error"
                          disabled={discardInFlight}
                          onClick={() => {
                            commitDiscardReview({
                              variables: { reviewId: pendingReview.id },
                              onCompleted: () => {
                                toast.info('Pending review discarded');
                                refresh();
                              },
                              onError: (e) =>
                                toast.error('Discard failed', e.message),
                            });
                          }}
                        >
                          Discard pending
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="menu-title">
                        <span>Start review</span>
                      </li>
                      {(
                        [
                          ['APPROVE', 'Approve'],
                          ['COMMENT', 'Comment'],
                          ['REQUEST_CHANGES', 'Request changes'],
                        ] as const
                      ).map(([event, label]) => (
                        <li key={event}>
                          <button
                            type="button"
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
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              </div>
            ) : null}

            {canReview ? (
              <div className="join rounded-full border border-base-300 overflow-hidden bg-base-100">
                {allowedMethods.length > 0 ? (
                  <select
                    className="select select-sm join-item border-0 bg-transparent focus:outline-none w-auto max-w-[min(100%,11rem)] rounded-none"
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
                ) : null}
                <button
                  type="button"
                  className="btn btn-sm btn-primary join-item rounded-none border-0"
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
                          toast.info(
                            `Merged (${MERGE_SHORT[activeMergeMethod]})`,
                          );
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
              </div>
            ) : null}

            {canReview ? (
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
            ) : null}

            <ExternalLink className="btn btn-sm btn-ghost" href={pr.url}>
              GitHub
            </ExternalLink>
          </div>
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
          <div className="w-full max-w-[min(100%,48rem)] mx-auto space-y-3 min-w-0">
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
              <GithubMarkdown html={pr.bodyHTML} text={pr.body} />
            </div>

            <div>
              <div className="text-xs font-medium opacity-60 mb-1">Reviews</div>
              <ul className="space-y-1 mb-3">
                {pr.reviews?.nodes?.map((r) =>
                  r ? (
                    <li key={r.id} className="text-xs border border-base-300 rounded p-2 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <AuthorByline
                          className="flex-1 min-w-0"
                          author={
                            r.author
                              ? {
                                  login: r.author.login,
                                  avatarUrl: r.author.avatarUrl,
                                  name:
                                    r.author && 'name' in r.author
                                      ? (r.author as { name?: string | null })
                                          .name
                                      : null,
                                }
                              : null
                          }
                          meta={
                            r.state === 'PENDING' ? undefined : r.state
                          }
                        />
                        {r.state === 'PENDING' ? (
                          <span className="badge badge-warning badge-sm shrink-0">
                            Pending
                          </span>
                        ) : null}
                      </div>
                      {r.body || r.bodyHTML ? (
                        <div className="mt-1">
                          <GithubMarkdown html={r.bodyHTML} text={r.body} />
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
                  <GithubMarkdown html={c.bodyHTML} text={c.body} />
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
    </div>
  );
}
