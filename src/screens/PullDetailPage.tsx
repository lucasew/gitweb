import {
  fetchQuery,
  graphql,
  useLazyLoadQuery,
  useMutation,
  useRelayEnvironment,
} from 'react-relay';
import { STORE_AND_NETWORK } from '@/lib/relayPolicy';
import {
  lazy,
  Suspense,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Link } from '@tanstack/react-router';
import {
  CircleCheck,
  ExternalLink as ExternalLinkIcon,
  Ellipsis,
  FileWarning,
  GitBranch,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequestDraft,
  MessageSquare,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import type {
  PullDetailPageQuery,
  PullDetailPageQuery$data,
} from './__generated__/PullDetailPageQuery.graphql';
import type { PullDetailPageMergeMutation } from './__generated__/PullDetailPageMergeMutation.graphql';
import type { PullDetailPageCloseMutation } from './__generated__/PullDetailPageCloseMutation.graphql';
import type { PullDetailPageReviewMutation } from './__generated__/PullDetailPageReviewMutation.graphql';
import type { PullDetailPageSubmitReviewMutation } from './__generated__/PullDetailPageSubmitReviewMutation.graphql';
import type { PullDetailPageDiscardReviewMutation } from './__generated__/PullDetailPageDiscardReviewMutation.graphql';
import type { PullDetailPageConvertToDraftMutation } from './__generated__/PullDetailPageConvertToDraftMutation.graphql';
import type { PullDetailPageReadyForReviewMutation } from './__generated__/PullDetailPageReadyForReviewMutation.graphql';
import { useToast } from '@/lib/toast';
import { useLiveQuery } from '@/lib/useLiveQuery';
import { LoadingBlock } from '@/components/LoadingBlock';
import { ExternalLink } from '@/components/ExternalLink';
import { AuthorByline } from '@/components/AuthorByline';
import { GithubMarkdown } from '@/components/GithubMarkdown';
import { PrStateBadge } from '@/components/PrStateBadge';
import { ReviewStateBadge } from '@/components/ReviewStateBadge';
import { PrChecksStrip } from '@/components/PrChecksStrip';
import { ReactionBar } from '@/components/ReactionBar';
import {
  RequestReviewersModal,
  RequestedReviewersStrip,
  type ReviewerUser,
} from '@/components/RequestReviewersModal';
import { CopyableNumber } from '@/components/CopyableNumber';
import { cn } from '@/lib/cls';

const PullFilesDiff = lazy(() =>
  import('@/components/PullFilesDiff').then((m) => ({
    default: m.PullFilesDiff,
  })),
);

const query = graphql`
  query PullDetailPageQuery($owner: String!, $name: String!, $number: Int!) {
    viewer {
      login
    }
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
        ...ReactionBar_reactable
        author {
          login
          avatarUrl(size: 64)
          ... on User {
            name
          }
        }
        baseRefName
        headRefName
        headRefOid
        reviewRequests(first: 40) {
          nodes {
            id
            asCodeOwner
            requestedReviewer {
              __typename
              ... on User {
                id
                login
                userName: name
                avatarUrl(size: 40)
              }
              ... on Team {
                id
                teamName: name
                combinedSlug
              }
              ... on Bot {
                id
                login
                avatarUrl(size: 40)
              }
            }
          }
        }
        suggestedReviewers {
          isAuthor
          isCommenter
          reviewer {
            id
            login
            name
            avatarUrl(size: 40)
          }
        }
        viewerLatestReview {
          id
          state
          body
          bodyHTML
          viewerDidAuthor
        }
        pendingReviews: reviews(first: 10, states: [PENDING]) {
          nodes {
            id
            state
            body
            bodyHTML
            viewerDidAuthor
            author {
              login
            }
          }
        }
        # Chronological conversation feed
        timelineItems(
          first: 100
          itemTypes: [
            ISSUE_COMMENT
            PULL_REQUEST_REVIEW
            PULL_REQUEST_COMMIT
            HEAD_REF_FORCE_PUSHED_EVENT
          ]
        ) {
          nodes {
            __typename
            ... on IssueComment {
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
              ...ReactionBar_reactable
            }
            ... on PullRequestReview {
              id
              state
              body
              bodyHTML
              createdAt
              viewerDidAuthor
              author {
                login
                avatarUrl(size: 40)
                ... on User {
                  name
                }
              }
              ...ReactionBar_reactable
            }
            ... on PullRequestCommit {
              id
              url
              commit {
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
            ... on HeadRefForcePushedEvent {
              id
              createdAt
              actor {
                login
                avatarUrl(size: 40)
                ... on User {
                  name
                }
              }
              beforeCommit {
                abbreviatedOid
                oid
              }
              afterCommit {
                abbreviatedOid
                oid
                url
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

const convertToDraftMutation = graphql`
  mutation PullDetailPageConvertToDraftMutation($id: ID!) {
    convertPullRequestToDraft(input: { pullRequestId: $id }) {
      pullRequest {
        id
        isDraft
        state
      }
    }
  }
`;

const readyForReviewMutation = graphql`
  mutation PullDetailPageReadyForReviewMutation($id: ID!) {
    markPullRequestReadyForReview(input: { pullRequestId: $id }) {
      pullRequest {
        id
        isDraft
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

/** Shown in the merge pill select (compact). */
const MERGE_SHORT: Record<MergeMethod, string> = {
  MERGE: 'Merge',
  SQUASH: 'Squash',
  REBASE: 'Rebase',
};

/** Longer copy for option titles / a11y (hover). */
const MERGE_HINT: Record<MergeMethod, string> = {
  MERGE: 'Create a merge commit',
  SQUASH: 'Squash and merge',
  REBASE: 'Rebase and merge',
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
  const data = useLazyLoadQuery<PullDetailPageQuery>(
    query,
    variables,
    STORE_AND_NETWORK,
  );
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
  const [reviewersOpen, setReviewersOpen] = useState(false);
  /** Single daisyUI popover for draft / review / merge / close */
  const actionsPopoverDomId = `pr-actions-${useId().replace(/:/g, '')}`;
  const actionsAnchorName = `--${actionsPopoverDomId}`;
  const actionsPopoverRef = useRef<HTMLDivElement>(null);
  const closeActionsPopover = () => {
    const el = actionsPopoverRef.current;
    if (!el || typeof el.hidePopover !== 'function') return;
    try {
      el.hidePopover();
    } catch {
      /* already closed */
    }
  };

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
  const [commitConvertToDraft, convertToDraftInFlight] =
    useMutation<PullDetailPageConvertToDraftMutation>(convertToDraftMutation);
  const [commitReadyForReview, readyForReviewInFlight] =
    useMutation<PullDetailPageReadyForReviewMutation>(readyForReviewMutation);

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
  const viewerLogin = data.viewer?.login;

  const requestedReviewers: ReviewerUser[] = (
    pr.reviewRequests?.nodes ?? []
  ).flatMap((n) => {
    const r = n?.requestedReviewer;
    if (!r || r.__typename !== 'User' || !('id' in r) || !r.id || !r.login) {
      return [];
    }
    return [
      {
        id: r.id,
        login: r.login,
        name: 'userName' in r ? (r.userName ?? null) : null,
        avatarUrl: 'avatarUrl' in r ? (r.avatarUrl ?? null) : null,
      },
    ];
  });

  const suggestedReviewers: ReviewerUser[] = (
    pr.suggestedReviewers ?? []
  ).flatMap((s) => {
    const r = s?.reviewer;
    if (!r?.id || !r.login) return [];
    if (r.login === pr.author?.login) return [];
    return [
      {
        id: r.id,
        login: r.login,
        name: r.name ?? null,
        avatarUrl: r.avatarUrl ?? null,
      },
    ];
  });

  /** Line comments create a PENDING review; prefer reviews(states:[PENDING]). */
  const findPendingReview = (
    payload: PullDetailPageQuery$data | null | undefined,
  ) => {
    const pull = payload?.repository?.pullRequest;
    if (!pull) return null;
    const login = payload?.viewer?.login ?? viewerLogin;
    return (
      pull.pendingReviews?.nodes?.find(
        (r) =>
          r &&
          (r.viewerDidAuthor || (login != null && r.author?.login === login)),
      ) ??
      (pull.viewerLatestReview?.state === 'PENDING' &&
      pull.viewerLatestReview.viewerDidAuthor !== false
        ? pull.viewerLatestReview
        : null) ??
      null
    );
  };

  const pendingReview = findPendingReview(data);

  const allowedMethods: MergeMethod[] = (() => {
    const methods = (
      [
        repo?.mergeCommitAllowed ? 'MERGE' : null,
        repo?.squashMergeAllowed ? 'SQUASH' : null,
        repo?.rebaseMergeAllowed ? 'REBASE' : null,
      ] as const
    ).filter((m): m is MergeMethod => m != null);
    const def = repo?.viewerDefaultMergeMethod as MergeMethod | undefined;
    if (def && methods.includes(def) && methods[0] !== def) {
      return [def, ...methods.filter((m) => m !== def)];
    }
    return methods;
  })();

  type ReviewEvent = 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES';

  const reviewBusy = reviewInFlight || submitInFlight || discardInFlight;
  const draftBusy = convertToDraftInFlight || readyForReviewInFlight;

  const runSubmitPending = (
    reviewId: string,
    event: ReviewEvent,
    label: string,
    body: string | null,
  ) => {
    commitSubmitReview({
      variables: { reviewId, event, body },
      onCompleted: (resp) => {
        if (!resp.submitPullRequestReview?.pullRequestReview) {
          toast.error('Submit review failed', 'GitHub returned no review');
          return;
        }
        setReviewBody('');
        toast.info(`Review submitted: ${label}`);
        refresh();
      },
      onError: (e) => toast.error('Submit review failed', e.message),
    });
  };

  /**
   * Submit a verdict. If a pending review already exists (line comments, etc.),
   * submit that via submitPullRequestReview instead of addPullRequestReview.
   */
  const runReview = (event: ReviewEvent, label: string) => {
    const body = reviewBody.trim();
    if (event === 'COMMENT' && !body) {
      toast.error(
        'Comment review needs a body',
        'Type feedback in the review field, then try again.',
      );
      return;
    }
    const bodyVar = body || null;

    if (pendingReview) {
      runSubmitPending(pendingReview.id, event, label, bodyVar);
      return;
    }

    commitReview({
      variables: { id: pr.id, event, body: bodyVar },
      onCompleted: (resp) => {
        const review = resp.addPullRequestReview?.pullRequestReview;
        if (!review) {
          toast.error(
            'Review failed',
            'GitHub returned no review (check permissions / branch rules)',
          );
          return;
        }
        setReviewBody('');
        toast.info(
          review.state === 'PENDING'
            ? 'Review started (pending)'
            : `Review: ${label} (${review.state})`,
        );
        refresh();
      },
      onError: (e) => {
        const msg = e.message || '';
        // Race / stale store: pending exists but UI missed it → resolve id + submit
        if (/one pending review/i.test(msg)) {
          void fetchQuery<PullDetailPageQuery>(env, query, variables, {
            fetchPolicy: 'network-only',
          })
            .toPromise()
            .then((fresh) => {
              const pending = findPendingReview(fresh);
              if (pending) {
                toast.info('Found pending review — submitting…');
                runSubmitPending(pending.id, event, label, bodyVar);
                return;
              }
              toast.error(
                'You already have a pending review',
                'Could not load it. Discard on GitHub or refresh and try again.',
              );
            })
            .catch((err: Error) =>
              toast.error('Review failed', err.message || msg),
            );
          return;
        }
        toast.error('Review failed', msg);
      },
    });
  };

  const runDiscardPending = () => {
    if (!pendingReview) return;
    commitDiscardReview({
      variables: { reviewId: pendingReview.id },
      onCompleted: () => {
        toast.info('Pending review discarded');
        refresh();
      },
      onError: (e) => toast.error('Discard failed', e.message),
    });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)] w-full">
      <div className="w-full min-w-0 flex-1 space-y-3 p-[clamp(0.75rem,2vw,1.25rem)]">
        {/* Header + tabs: always full content width (same on conversation and files) */}
        <div className="flex items-start gap-2 w-full">
          <h1 className="text-xl font-semibold min-w-0 flex-1">
            {pr.title}{' '}
            <CopyableNumber
              number={pr.number}
              className="opacity-50 font-normal"
            />
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

        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 w-full min-w-0 border-b border-base-300">
          {/* Tabs stay one unit when the row wraps */}
          <div
            role="tablist"
            className="tabs tabs-bordered shrink-0 min-w-0"
          >
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

          <div className="flex flex-nowrap items-center gap-1.5 shrink-0 ms-auto pb-1">
            {pendingReview ? (
              <ReviewStateBadge state="PENDING" label="Pending review" />
            ) : null}

            {!pr.merged ? (
              <button
                type="button"
                className="btn btn-sm btn-ghost gap-1.5"
                title="Request reviewers"
                aria-label="Request reviewers"
                onClick={() => setReviewersOpen(true)}
              >
                <UserPlus className="size-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Reviewers</span>
                {requestedReviewers.length > 0 ? (
                  <span className="badge badge-xs badge-ghost tabular-nums">
                    {requestedReviewers.length}
                  </span>
                ) : null}
              </button>
            ) : null}

            <ExternalLink
              className="btn btn-sm btn-ghost gap-1.5"
              href={pr.url}
              title="Open on GitHub"
              aria-label="Open on GitHub"
            >
              <ExternalLinkIcon className="size-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">GitHub</span>
            </ExternalLink>

            {canReview ? (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost gap-1.5"
                  title="PR actions"
                  aria-label="PR actions"
                  popoverTarget={actionsPopoverDomId}
                  style={{ anchorName: actionsAnchorName } as CSSProperties}
                >
                  <Ellipsis className="size-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">More</span>
                </button>
                <div
                  ref={actionsPopoverRef}
                  id={actionsPopoverDomId}
                  popover="auto"
                  className={cn(
                    'dropdown dropdown-end',
                    'w-80 max-w-[min(20rem,calc(100vw-1rem))]',
                    'max-h-[min(32rem,calc(100dvh-2rem))] overflow-y-auto',
                    'rounded-box bg-base-100 p-3 shadow-lg border border-base-300',
                    'space-y-3',
                  )}
                  style={
                    {
                      positionAnchor: actionsAnchorName,
                      positionArea: 'bottom span-left',
                      positionTryFallbacks: 'flip-block, flip-inline',
                    } as CSSProperties
                  }
                >
                  <div className="space-y-1">
                    <div className="text-xs font-medium opacity-60">Draft</div>
                    <button
                      type="button"
                      className={cn(
                        'btn btn-sm w-full justify-start gap-2',
                        pr.isDraft ? 'btn-primary' : 'btn-ghost',
                      )}
                      disabled={draftBusy}
                      popoverTarget={actionsPopoverDomId}
                      popoverTargetAction="hide"
                      onClick={() => {
                        closeActionsPopover();
                        if (pr.isDraft) {
                          commitReadyForReview({
                            variables: { id: pr.id },
                            optimisticResponse: {
                              markPullRequestReadyForReview: {
                                pullRequest: {
                                  id: pr.id,
                                  isDraft: false,
                                  state: pr.state,
                                },
                              },
                            },
                            onCompleted: () => {
                              toast.info('Marked ready for review');
                              refresh();
                            },
                            onError: (e) =>
                              toast.error('Could not mark ready', e.message),
                          });
                        } else {
                          commitConvertToDraft({
                            variables: { id: pr.id },
                            optimisticResponse: {
                              convertPullRequestToDraft: {
                                pullRequest: {
                                  id: pr.id,
                                  isDraft: true,
                                  state: pr.state,
                                },
                              },
                            },
                            onCompleted: () => {
                              toast.info('Converted to draft');
                              refresh();
                            },
                            onError: (e) =>
                              toast.error(
                                'Could not convert to draft',
                                e.message,
                              ),
                          });
                        }
                      }}
                    >
                      {pr.isDraft ? (
                        <CircleCheck className="size-4 shrink-0" aria-hidden />
                      ) : (
                        <GitPullRequestDraft
                          className="size-4 shrink-0"
                          aria-hidden
                        />
                      )}
                      {draftBusy
                        ? 'Updating…'
                        : pr.isDraft
                          ? 'Ready for review'
                          : 'Convert to draft'}
                    </button>
                  </div>

                  <div className="space-y-2 border-t border-base-300 pt-3">
                    <div className="text-xs font-medium opacity-60">
                      {pendingReview ? 'Submit pending review' : 'Review'}
                    </div>
                    <textarea
                      className="textarea textarea-bordered textarea-sm w-full min-h-16 font-normal bg-base-100 text-base-content border-base-300"
                      placeholder="Optional summary…"
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                    />
                    <div className="flex flex-col gap-1">
                      {(
                        [
                          ['APPROVE', 'Approve', CircleCheck],
                          [
                            'COMMENT',
                            pendingReview ? 'Comment only' : 'Comment',
                            MessageSquare,
                          ],
                          [
                            'REQUEST_CHANGES',
                            'Request changes',
                            FileWarning,
                          ],
                        ] as const
                      ).map(([event, label, Icon]) => (
                        <button
                          key={event}
                          type="button"
                          className="btn btn-sm btn-ghost justify-start gap-2"
                          disabled={reviewBusy}
                          popoverTarget={actionsPopoverDomId}
                          popoverTargetAction="hide"
                          onClick={() => {
                            closeActionsPopover();
                            runReview(event, label);
                          }}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden />
                          {label}
                        </button>
                      ))}
                      {pendingReview ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost text-error justify-start gap-2"
                          disabled={discardInFlight}
                          popoverTarget={actionsPopoverDomId}
                          popoverTargetAction="hide"
                          onClick={() => {
                            closeActionsPopover();
                            runDiscardPending();
                          }}
                        >
                          <Trash2 className="size-4 shrink-0" aria-hidden />
                          Discard pending
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-base-300 pt-3">
                    <div className="text-xs font-medium opacity-60">Merge</div>
                    {pr.mergeable === 'CONFLICTING' ? (
                      <p className="text-xs text-error px-1">
                        This branch has conflicts that must be resolved.
                      </p>
                    ) : null}
                    {allowedMethods.length === 0 ? (
                      <p className="text-xs opacity-50 px-1">
                        No merge methods enabled on this repository.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {allowedMethods.map((m) => {
                          const MergeIcon =
                            m === 'MERGE'
                              ? GitMerge
                              : m === 'SQUASH'
                                ? GitCommitHorizontal
                                : GitBranch;
                          return (
                            <button
                              key={m}
                              type="button"
                              className="btn btn-sm btn-ghost justify-start gap-2"
                              disabled={
                                mergeInFlight ||
                                merging ||
                                pr.mergeable === 'CONFLICTING'
                              }
                              title={MERGE_HINT[m]}
                              popoverTarget={actionsPopoverDomId}
                              popoverTargetAction="hide"
                              onClick={() => {
                                closeActionsPopover();
                                setMerging(true);
                                commitMerge({
                                  variables: {
                                    id: pr.id,
                                    mergeMethod: m,
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
                                    if (
                                      res.mergePullRequest?.pullRequest?.merged
                                    ) {
                                      toast.info(
                                        `Merged (${MERGE_SHORT[m]})`,
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
                              <MergeIcon
                                className="size-4 shrink-0"
                                aria-hidden
                              />
                              {mergeInFlight || merging
                                ? 'Merging…'
                                : MERGE_SHORT[m]}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-base-300 pt-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost w-full justify-start gap-2"
                      disabled={closeInFlight}
                      popoverTarget={actionsPopoverDomId}
                      popoverTargetAction="hide"
                      onClick={() => {
                        closeActionsPopover();
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
                          onError: (e) =>
                            toast.error('Close failed', e.message),
                        });
                      }}
                    >
                      <XCircle className="size-4 shrink-0" aria-hidden />
                      Close pull request
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {tab === 'files' ? (
          <Suspense fallback={<LoadingBlock label="Loading diffs…" />}>
            <PullFilesDiff
              owner={owner}
              name={name}
              number={number}
              pullRequestId={pr.id}
              headRef={pr.headRefOid || pr.headRefName}
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
              <ReactionBar reactable={pr} />
            </div>

            <PrChecksStrip owner={owner} name={name} number={number} />

            <RequestedReviewersStrip
              requested={requestedReviewers}
              onOpenModal={() => setReviewersOpen(true)}
            />

            <div className="space-y-2">
              <div className="text-xs font-medium opacity-60">Timeline</div>
              {(pr.timelineItems?.nodes ?? []).map((item, idx) => {
                if (!item) return null;
                const key =
                  'id' in item && item.id
                    ? item.id
                    : `${item.__typename}-${idx}`;

                if (item.__typename === 'IssueComment') {
                  return (
                    <div
                      key={key}
                      className="border border-base-300 rounded-box p-3"
                    >
                      <div className="mb-2">
                        <AuthorByline
                          author={
                            item.author
                              ? {
                                  login: item.author.login,
                                  avatarUrl: item.author.avatarUrl,
                                  name:
                                    item.author && 'name' in item.author
                                      ? (
                                          item.author as {
                                            name?: string | null;
                                          }
                                        ).name
                                      : null,
                                }
                              : null
                          }
                          meta={new Date(item.createdAt).toLocaleString()}
                        />
                      </div>
                      <GithubMarkdown
                        html={item.bodyHTML}
                        text={item.body}
                      />
                      <ReactionBar reactable={item} />
                    </div>
                  );
                }

                if (item.__typename === 'PullRequestReview') {
                  // Pending draft reviews still show in review UI below
                  if (item.state === 'PENDING') return null;
                  return (
                    <div
                      key={key}
                      className="border border-base-300 rounded-box p-3 space-y-1"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <AuthorByline
                          className="flex-1 min-w-0"
                          author={
                            item.author
                              ? {
                                  login: item.author.login,
                                  avatarUrl: item.author.avatarUrl,
                                  name:
                                    item.author && 'name' in item.author
                                      ? (
                                          item.author as {
                                            name?: string | null;
                                          }
                                        ).name
                                      : null,
                                }
                              : null
                          }
                          meta={
                            item.createdAt
                              ? new Date(item.createdAt).toLocaleString()
                              : undefined
                          }
                        />
                        <ReviewStateBadge state={item.state} />
                      </div>
                      {item.body || item.bodyHTML ? (
                        <GithubMarkdown
                          html={item.bodyHTML}
                          text={item.body}
                        />
                      ) : null}
                      <ReactionBar reactable={item} />
                    </div>
                  );
                }

                if (item.__typename === 'PullRequestCommit') {
                  const c = item.commit;
                  if (!c) return null;
                  const authorLogin = c.author?.user?.login ?? null;
                  const authorName =
                    c.author?.user?.name ?? c.author?.name ?? null;
                  const authorAvatar =
                    c.author?.user?.avatarUrl ?? c.author?.avatarUrl ?? null;
                  return (
                    <div
                      key={key}
                      className="border border-base-300 rounded-box px-3 py-2 bg-base-200/40 space-y-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <GitCommitHorizontal
                          className="size-4 shrink-0 opacity-60"
                          aria-hidden
                        />
                        <AuthorByline
                          className="min-w-0 flex-1"
                          author={{
                            login: authorLogin ?? authorName ?? 'unknown',
                            avatarUrl: authorAvatar,
                            name: authorName,
                          }}
                          meta={new Date(c.committedDate).toLocaleString()}
                        />
                        <Link
                          to="/$owner/$name/commit/$sha"
                          params={{ owner, name, sha: c.oid }}
                          className="font-mono text-xs link link-hover shrink-0 tabular-nums"
                          title={c.oid}
                        >
                          {c.abbreviatedOid}
                        </Link>
                      </div>
                      <div className="ps-6 min-w-0 text-sm font-medium break-words">
                        {c.messageHeadline}
                      </div>
                    </div>
                  );
                }

                if (item.__typename === 'HeadRefForcePushedEvent') {
                  const before = item.beforeCommit?.abbreviatedOid ?? '…';
                  const after = item.afterCommit?.abbreviatedOid ?? '…';
                  const afterUrl = item.afterCommit?.url;
                  return (
                    <div
                      key={key}
                      className="flex flex-wrap items-center gap-2 text-sm border border-base-300 rounded-box px-3 py-2 bg-base-200/40"
                    >
                      <GitBranch
                        className="size-4 shrink-0 opacity-60"
                        aria-hidden
                      />
                      <AuthorByline
                        className="min-w-0 max-w-[12rem] sm:max-w-[16rem] !w-auto"
                        author={
                          item.actor
                            ? {
                                login: item.actor.login,
                                avatarUrl: item.actor.avatarUrl,
                                name:
                                  item.actor && 'name' in item.actor
                                    ? (
                                        item.actor as {
                                          name?: string | null;
                                        }
                                      ).name
                                    : null,
                              }
                            : null
                        }
                      />
                      <span className="opacity-80">
                        force-pushed the branch from{' '}
                        <span className="font-mono text-xs">{before}</span>
                        {' to '}
                        {afterUrl ? (
                          <ExternalLink
                            href={afterUrl}
                            className="font-mono text-xs link link-hover"
                          >
                            {after}
                          </ExternalLink>
                        ) : (
                          <span className="font-mono text-xs">{after}</span>
                        )}
                      </span>
                      <span className="text-xs opacity-50 shrink-0 ms-auto">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                  );
                }

                return null;
              })}
              {(pr.timelineItems?.nodes?.length ?? 0) === 0 ? (
                <p className="text-sm opacity-50">No timeline activity yet.</p>
              ) : null}
            </div>

            {!pr.merged && pr.state === 'OPEN' ? (
              <div className="space-y-2 border border-base-300 rounded-box p-3">
                <div className="text-sm font-medium flex flex-wrap items-center gap-2">
                  {pendingReview ? 'Submit pending review' : 'Submit review'}
                  {pendingReview ? (
                    <ReviewStateBadge state="PENDING" />
                  ) : null}
                </div>
                <textarea
                  className="textarea textarea-bordered w-full min-h-20 bg-base-100 text-base-content border-base-300"
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
                      disabled={reviewBusy}
                      onClick={() => runReview(event, label)}
                    >
                      {label}
                    </button>
                  ))}
                  {pendingReview ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost text-error"
                      disabled={discardInFlight}
                      onClick={runDiscardPending}
                    >
                      Discard pending
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )}

        <RequestReviewersModal
          open={reviewersOpen}
          onClose={() => setReviewersOpen(false)}
          pullRequestId={pr.id}
          owner={owner}
          name={name}
          requested={requestedReviewers}
          suggested={suggestedReviewers}
          onChanged={refresh}
        />
      </div>
    </div>
  );
}
