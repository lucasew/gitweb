import { graphql, useLazyLoadQuery, useMutation } from 'react-relay';
import { STORE_AND_NETWORK } from '@/lib/relayPolicy';
import { ConnectionHandler } from 'relay-runtime';
import { useState } from 'react';
import type { IssueDetailPageQuery } from './__generated__/IssueDetailPageQuery.graphql';
import type { IssueDetailPageCloseMutation } from './__generated__/IssueDetailPageCloseMutation.graphql';
import type { IssueDetailPageReopenMutation } from './__generated__/IssueDetailPageReopenMutation.graphql';
import type { IssueDetailPageCommentMutation } from './__generated__/IssueDetailPageCommentMutation.graphql';
import type { IssueDetailPageTitleMutation } from './__generated__/IssueDetailPageTitleMutation.graphql';
import { useToast } from '@/lib/toast';
import { useLiveQuery } from '@/lib/useLiveQuery';
import { ExternalLink } from '@/components/ExternalLink';
import { AuthorByline } from '@/components/AuthorByline';
import { GithubMarkdown } from '@/components/GithubMarkdown';
import { IssueStateBadge } from '@/components/IssueStateBadge';

const query = graphql`
  query IssueDetailPageQuery($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      issue(number: $number) {
        id
        number
        title
        body
        bodyHTML
        state
        stateReason
        createdAt
        updatedAt
        closedAt
        url
        author {
          login
          avatarUrl(size: 64)
          ... on User {
            name
          }
        }
        labels(first: 20) {
          nodes {
            id
            name
            color
          }
        }
        assignees(first: 10) {
          nodes {
            id
            login
            avatarUrl
          }
        }
        comments(first: 50)
          @connection(key: "IssueDetailPage_comments") {
          edges {
            node {
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
        }
      }
    }
  }
`;

const closeMutation = graphql`
  mutation IssueDetailPageCloseMutation($id: ID!) {
    closeIssue(input: { issueId: $id }) {
      issue {
        id
        state
        stateReason
        closedAt
      }
    }
  }
`;

const reopenMutation = graphql`
  mutation IssueDetailPageReopenMutation($id: ID!) {
    reopenIssue(input: { issueId: $id }) {
      issue {
        id
        state
        stateReason
        closedAt
      }
    }
  }
`;

const commentMutation = graphql`
  mutation IssueDetailPageCommentMutation($id: ID!, $body: String!) {
    addComment(input: { subjectId: $id, body: $body }) {
      commentEdge {
        cursor
        node {
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
    }
  }
`;

const titleMutation = graphql`
  mutation IssueDetailPageTitleMutation($id: ID!, $title: String!) {
    updateIssue(input: { id: $id, title: $title }) {
      issue {
        id
        title
      }
    }
  }
`;

type Props = { owner: string; name: string; number: number };

export function IssueDetailPage({ owner, name, number }: Props) {
  const toast = useToast();
  const variables = { owner, name, number };
  const data = useLazyLoadQuery<IssueDetailPageQuery>(
    query,
    variables,
    STORE_AND_NETWORK,
  );
  useLiveQuery(query, variables);

  const issue = data.repository?.issue;
  const [body, setBody] = useState('');
  const [metaOpen, setMetaOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const [commitClose, closeInFlight] =
    useMutation<IssueDetailPageCloseMutation>(closeMutation);
  const [commitReopen, reopenInFlight] =
    useMutation<IssueDetailPageReopenMutation>(reopenMutation);
  const [commitComment, commentInFlight] =
    useMutation<IssueDetailPageCommentMutation>(commentMutation);
  const [commitTitle, titleInFlight] =
    useMutation<IssueDetailPageTitleMutation>(titleMutation);

  if (!issue) {
    return (
      <div className="p-4 alert alert-warning">
        Issue not found.{' '}
        <ExternalLink
          className="link"
          href={`https://github.com/${owner}/${name}/issues/${number}`}
        >
          Open on GitHub
        </ExternalLink>
      </div>
    );
  }

  const open = issue.state === 'OPEN';
  const commentNodes =
    issue.comments?.edges?.map((e) => e?.node).filter(Boolean) ?? [];

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)] w-full">
      <div className="w-full min-w-0 flex-1 space-y-3 p-[clamp(0.75rem,2vw,1.25rem)]">
        <div className="flex items-start gap-2 w-full min-w-0">
          {editingTitle ? (
            <div className="flex flex-wrap gap-2 grow w-full min-w-0">
              <input
                className="input input-bordered input-sm flex-1 min-w-0 bg-base-100 text-base-content border-base-300"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={titleInFlight || !titleDraft.trim()}
                onClick={() => {
                  const next = titleDraft.trim();
                  commitTitle({
                    variables: { id: issue.id, title: next },
                    optimisticResponse: {
                      updateIssue: { issue: { id: issue.id, title: next } },
                    },
                    onCompleted: () => setEditingTitle(false),
                    onError: (e) => toast.error('Title update failed', e.message),
                  });
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setEditingTitle(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1 className="text-xl font-semibold min-w-0 flex-1">
              <button
                type="button"
                className="text-left hover:underline"
                onClick={() => {
                  setTitleDraft(issue.title);
                  setEditingTitle(true);
                }}
                title="Edit title"
              >
                {issue.title}
              </button>{' '}
              <span className="opacity-50 font-normal">#{issue.number}</span>
            </h1>
          )}
          <IssueStateBadge className="shrink-0" state={issue.state} />
        </div>

        <div className="flex flex-wrap items-end gap-2 w-full min-w-0 border-b border-base-300">
          <div className="tabs tabs-bordered min-w-0 flex-1">
            <span className="tab tab-active" aria-current="page">
              Conversation
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0 ms-auto pb-1">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setMetaOpen((v) => !v)}
            >
              {metaOpen ? 'Hide details' : 'Details'}
            </button>
            {open ? (
              <button
                type="button"
                className="btn btn-sm"
                disabled={closeInFlight}
                onClick={() => {
                  commitClose({
                    variables: { id: issue.id },
                    optimisticResponse: {
                      closeIssue: {
                        issue: {
                          id: issue.id,
                          state: 'CLOSED',
                          stateReason: 'COMPLETED',
                          closedAt: new Date().toISOString(),
                        },
                      },
                    },
                    onError: (e) => toast.error('Close failed', e.message),
                  });
                }}
              >
                Close
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={reopenInFlight}
                onClick={() => {
                  commitReopen({
                    variables: { id: issue.id },
                    optimisticResponse: {
                      reopenIssue: {
                        issue: {
                          id: issue.id,
                          state: 'OPEN',
                          stateReason: null,
                          closedAt: null,
                        },
                      },
                    },
                    onError: (e) => toast.error('Reopen failed', e.message),
                  });
                }}
              >
                Reopen
              </button>
            )}
            <ExternalLink className="btn btn-sm btn-ghost" href={issue.url}>
              GitHub
            </ExternalLink>
          </div>
        </div>

        <div className="w-full max-w-[min(100%,48rem)] mx-auto space-y-3 min-w-0">
        {metaOpen ? (
          <div className="text-sm space-y-2 border border-base-300 rounded-box p-3">
            <div className="flex flex-wrap gap-1">
              {issue.labels?.nodes?.map((l) =>
                l ? (
                  <span key={l.id} className="badge badge-outline badge-sm">
                    {l.name}
                  </span>
                ) : null,
              )}
              {!issue.labels?.nodes?.length ? (
                <span className="opacity-50">No labels</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {issue.assignees?.nodes?.map((a) =>
                a ? (
                  <span key={a.id} className="text-xs">
                    @{a.login}
                  </span>
                ) : null,
              )}
              {!issue.assignees?.nodes?.length ? (
                <span className="opacity-50 text-xs">No assignees</span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="text-xs opacity-60">
            {(issue.labels?.nodes?.length ?? 0) > 0
              ? issue.labels!.nodes!.map((l) => l?.name).filter(Boolean).join(', ')
              : 'No labels'}
            {' · '}
            {(issue.assignees?.nodes?.length ?? 0) > 0
              ? issue.assignees!.nodes!.map((a) => a?.login).filter(Boolean).join(', ')
              : 'unassigned'}
          </div>
        )}

        <div className="border border-base-300 rounded-box p-3">
          <div className="mb-2">
            <AuthorByline
              size="md"
              author={
                issue.author
                  ? {
                      login: issue.author.login,
                      avatarUrl: issue.author.avatarUrl,
                      name:
                        issue.author && 'name' in issue.author
                          ? (issue.author as { name?: string | null }).name
                          : null,
                    }
                  : null
              }
              meta={new Date(issue.createdAt).toLocaleString()}
            />
          </div>
          <GithubMarkdown html={issue.bodyHTML} text={issue.body} />
        </div>

        <div className="space-y-3">
          {commentNodes.map((c) => {
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
        </div>

        <div className="space-y-2">
          <textarea
            className="textarea textarea-bordered w-full min-h-24 bg-base-100 text-base-content border-base-300"
            placeholder="Comment"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!body.trim() || commentInFlight}
            onClick={() => {
              const text = body.trim();
              const issueId = issue.id;
              commitComment({
                variables: { id: issueId, body: text },
                optimisticUpdater: (store) => {
                  const id = `client:optimisticComment:${Date.now()}`;
                  const node = store.create(id, 'IssueComment');
                  node.setValue(text, 'body');
                  node.setValue(new Date().toISOString(), 'createdAt');
                  const edge = store.create(`${id}:edge`, 'IssueCommentEdge');
                  edge.setLinkedRecord(node, 'node');
                  const issueRec = store.get(issueId);
                  if (!issueRec) return;
                  const conn = ConnectionHandler.getConnection(
                    issueRec,
                    'IssueDetailPage_comments',
                  );
                  if (conn) ConnectionHandler.insertEdgeAfter(conn, edge);
                },
                updater: (store) => {
                  const payload = store.getRootField('addComment');
                  const edge = payload?.getLinkedRecord('commentEdge');
                  if (!edge) return;
                  const issueRec = store.get(issueId);
                  if (!issueRec) return;
                  const conn = ConnectionHandler.getConnection(
                    issueRec,
                    'IssueDetailPage_comments',
                  );
                  if (conn) ConnectionHandler.insertEdgeAfter(conn, edge);
                },
                onCompleted: () => setBody(''),
                onError: (e) => toast.error('Comment failed', e.message),
              });
            }}
          >
            Comment
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
