import {
  fetchQuery,
  graphql,
  useLazyLoadQuery,
  useMutation,
  useRelayEnvironment,
} from 'react-relay';
import { lazy, Suspense, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PullDetailPageQuery } from './__generated__/PullDetailPageQuery.graphql';
import type { PullDetailPageMergeMutation } from './__generated__/PullDetailPageMergeMutation.graphql';
import type { PullDetailPageCloseMutation } from './__generated__/PullDetailPageCloseMutation.graphql';
import type { PullDetailPageReviewMutation } from './__generated__/PullDetailPageReviewMutation.graphql';
import { useToast } from '@/lib/toast';
import { useLiveQuery } from '@/lib/useLiveQuery';
import { LoadingBlock } from '@/components/LoadingBlock';

const PullFilesDiff = lazy(() =>
  import('@/components/PullFilesDiff').then((m) => ({
    default: m.PullFilesDiff,
  })),
);

const query = graphql`
  query PullDetailPageQuery($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
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
        }
        baseRefName
        headRefName
        reviews(first: 20) {
          nodes {
            id
            state
            author {
              login
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
            }
          }
        }
      }
    }
  }
`;

const mergeMutation = graphql`
  mutation PullDetailPageMergeMutation($id: ID!) {
    mergePullRequest(input: { pullRequestId: $id, mergeMethod: SQUASH }) {
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

type Props = { owner: string; name: string; number: number };
type Tab = 'conversation' | 'files';

export function PullDetailPage({ owner, name, number }: Props) {
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

  const pr = data.repository?.pullRequest;
  const [tab, setTab] = useState<Tab>('conversation');
  const [reviewBody, setReviewBody] = useState('');
  const [merging, setMerging] = useState(false);

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

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)] max-w-3xl mx-auto w-full">
      <div className="p-3 md:p-4 space-y-3 flex-1 pb-24">
        <div className="flex flex-wrap gap-2 items-start">
          <h1 className="text-xl font-semibold grow">
            {pr.title}{' '}
            <span className="opacity-50 font-normal">#{pr.number}</span>
          </h1>
          <span className="badge badge-sm">
            {pr.merged ? 'MERGED' : merging || mergeInFlight ? 'MERGING…' : pr.state}
            {pr.isDraft ? ' · draft' : ''}
          </span>
        </div>
        <div className="text-xs opacity-60 font-mono">
          {pr.headRefName} → {pr.baseRefName}
        </div>

        <div role="tablist" className="tabs tabs-bordered">
          <button
            type="button"
            role="tab"
            className={`tab ${tab === 'conversation' ? 'tab-active' : ''}`}
            onClick={() => setTab('conversation')}
          >
            Conversation
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${tab === 'files' ? 'tab-active' : ''}`}
            onClick={() => setTab('files')}
          >
            Files
          </button>
        </div>

        {tab === 'files' ? (
          <Suspense fallback={<LoadingBlock label="Loading diffs…" />}>
            <PullFilesDiff owner={owner} name={name} number={number} />
          </Suspense>
        ) : (
          <>
            <div className="border border-base-300 rounded-box p-3">
              <div className="text-xs opacity-60 mb-2">
                @{pr.author?.login ?? 'ghost'} ·{' '}
                {new Date(pr.createdAt).toLocaleString()}
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
                    <li key={r.id} className="text-xs border border-base-300 rounded p-2">
                      @{r.author?.login}: <strong>{r.state}</strong>
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
                  <div className="text-xs opacity-60 mb-2">
                    @{c.author?.login ?? 'ghost'} ·{' '}
                    {new Date(c.createdAt).toLocaleString()}
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
          </>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-base-300 bg-base-100 p-2 flex flex-wrap gap-2">
        {!pr.merged && pr.state === 'OPEN' ? (
          <>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={mergeInFlight || pr.mergeable === 'CONFLICTING'}
              onClick={() => {
                setMerging(true);
                commitMerge({
                  variables: { id: pr.id },
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
                      toast.info('Merged');
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
              {mergeInFlight || merging ? 'Merging…' : 'Squash merge'}
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
        <a
          className="btn btn-sm btn-ghost ml-auto"
          href={pr.url}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </div>
    </div>
  );
}
