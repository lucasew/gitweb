import { graphql, useLazyLoadQuery } from 'react-relay';
import { STORE_AND_NETWORK } from '@/lib/relayPolicy';
import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import type {
  ActionsListPageQuery,
  ActionsListPageQuery$data,
} from './__generated__/ActionsListPageQuery.graphql';
import { useLiveQuery } from '@/lib/useLiveQuery';
import { CheckStatusBadge } from '@/components/CheckStatusBadge';
import { ExternalLink } from '@/components/ExternalLink';
import { githubActionsHomeUrl } from '@/lib/rest';
import { anyInProgress, isCheckInProgress } from '@/lib/checkStatus';

const query = graphql`
  query ActionsListPageQuery($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      nameWithOwner
      url
      defaultBranchRef {
        name
        target {
          __typename
          ... on Commit {
            history(first: 12) {
              nodes {
                oid
                abbreviatedOid
                messageHeadline
                committedDate
                checkSuites(first: 25) {
                  nodes {
                    id
                    status
                    conclusion
                    updatedAt
                    branch {
                      name
                    }
                    workflowRun {
                      id
                      databaseId
                      runNumber
                      runAttempt
                      event
                      displayTitle
                      createdAt
                      updatedAt
                      url
                      workflow {
                        id
                        name
                        state
                      }
                    }
                    checkRuns(first: 20) {
                      nodes {
                        id
                        name
                        status
                        conclusion
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      pullRequests(
        first: 12
        states: OPEN
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          number
          title
          commits(last: 1) {
            nodes {
              commit {
                oid
                abbreviatedOid
                checkSuites(first: 20) {
                  nodes {
                    id
                    status
                    conclusion
                    updatedAt
                    workflowRun {
                      id
                      databaseId
                      runNumber
                      runAttempt
                      event
                      displayTitle
                      createdAt
                      updatedAt
                      url
                      workflow {
                        id
                        name
                        state
                      }
                    }
                    checkRuns(first: 15) {
                      nodes {
                        id
                        status
                        conclusion
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      environments(first: 15) {
        nodes {
          id
          name
          latestCompletedDeployment {
            state
            createdAt
          }
        }
      }
      deployments(first: 8, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          id
          environment
          state
          createdAt
          description
          latestStatus {
            state
            description
            createdAt
          }
        }
      }
    }
  }
`;

type Props = {
  owner: string;
  name: string;
};

type RunRow = {
  key: string;
  runId: string;
  databaseId: number | null;
  runNumber: number | null;
  title: string;
  workflowName: string;
  event: string;
  status: string | null;
  conclusion: string | null;
  branch: string | null;
  updatedAt: string | null;
  githubUrl: string | null;
  source: string;
};

export function ActionsListPage({ owner, name }: Props) {
  const variables = { owner, name };
  const data = useLazyLoadQuery<ActionsListPageQuery>(
    query,
    variables,
    STORE_AND_NETWORK,
  );

  const runs = useMemo(() => collectRuns(data), [data]);
  const live = anyInProgress(
    runs.map((r) => ({ status: r.status })),
  );
  useLiveQuery(query, variables, { active: live });

  const repo = data.repository;
  if (!repo) {
    return (
      <div className="p-4 alert alert-warning">Repository not found</div>
    );
  }

  const envs = repo.environments?.nodes?.filter(Boolean) ?? [];
  const deploys = repo.deployments?.nodes?.filter(Boolean) ?? [];
  const ghActions = githubActionsHomeUrl(owner, name);

  return (
    <div className="w-full min-w-0 p-[clamp(0.75rem,2vw,1.25rem)] space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div>
          <h1 className="text-lg font-semibold">Actions</h1>
          <p className="text-xs opacity-60">
            GraphQL best-effort from recent commits & open PRs. Full index on
            GitHub.
          </p>
        </div>
        <ExternalLink className="btn btn-sm btn-ghost" href={ghActions}>
          Open on GitHub
        </ExternalLink>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(12rem,16rem)]">
        <div className="min-w-0 space-y-2">
          <div className="text-xs font-medium opacity-60">Workflow runs</div>
          {runs.length === 0 ? (
            <div className="alert alert-info text-sm">
              No check suites found on recent default-branch commits or open
              PRs.{' '}
              <ExternalLink className="link" href={ghActions}>
                Browse Actions on GitHub
              </ExternalLink>
            </div>
          ) : (
            <ul className="card bg-base-100 border border-base-300 divide-y divide-base-300 dense-list w-full">
              {runs.map((r) => (
                <li key={r.key} className="dense-row w-full">
                  <div className="flex items-start gap-2 w-full">
                    <Link
                      to="/$owner/$name/actions/runs/$runId"
                      params={{ owner, name, runId: r.runId }}
                      className="link link-hover min-w-0 flex-1 pr-2"
                    >
                      <span className="font-semibold">{r.workflowName}</span>
                      {r.runNumber != null ? (
                        <span className="opacity-50 font-mono text-xs ms-1">
                          #{r.runNumber}
                        </span>
                      ) : null}
                      {r.title ? (
                        <span className="font-normal ms-1.5">{r.title}</span>
                      ) : null}
                    </Link>
                    <CheckStatusBadge
                      className="shrink-0"
                      status={r.status}
                      conclusion={r.conclusion}
                    />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs opacity-50">
                    {r.branch ? (
                      <span className="font-mono">{r.branch}</span>
                    ) : null}
                    <span>{r.source}</span>
                    {r.updatedAt ? (
                      <span>{new Date(r.updatedAt).toLocaleString()}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-3 min-w-0">
          <div>
            <div className="text-xs font-medium opacity-60 mb-1">
              Environments
            </div>
            {envs.length === 0 ? (
              <p className="text-xs opacity-50">None listed</p>
            ) : (
              <ul className="text-xs space-y-1">
                {envs.map((e) =>
                  e ? (
                    <li
                      key={e.id}
                      className="border border-base-300 rounded px-2 py-1"
                    >
                      <div className="font-medium">{e.name}</div>
                      {e.latestCompletedDeployment?.state ? (
                        <div className="opacity-50 capitalize">
                          last:{' '}
                          {String(e.latestCompletedDeployment.state)
                            .toLowerCase()
                            .replace(/_/g, ' ')}
                        </div>
                      ) : null}
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </div>
          <div>
            <div className="text-xs font-medium opacity-60 mb-1">
              Recent deployments
            </div>
            {deploys.length === 0 ? (
              <p className="text-xs opacity-50">None listed</p>
            ) : (
              <ul className="text-xs space-y-1">
                {deploys.map((d) =>
                  d ? (
                    <li
                      key={d.id}
                      className="border border-base-300 rounded px-2 py-1"
                    >
                      <div className="font-mono">{d.environment}</div>
                      <div className="opacity-50 capitalize">
                        {d.state
                          ? String(d.state).toLowerCase().replace(/_/g, ' ')
                          : '—'}
                        {d.createdAt
                          ? ` · ${new Date(d.createdAt).toLocaleString()}`
                          : ''}
                      </div>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function collectRuns(data: ActionsListPageQuery$data): RunRow[] {
  const byId = new Map<string, RunRow>();

  // Relay types nest deeply; narrow at runtime only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addSuite = (suite: any, source: string) => {
    const wr = suite?.workflowRun;
    if (!wr?.id) return;
    const runs = suite.checkRuns?.nodes ?? [];
    const status =
      suite.status ??
      runs.find(
        (c: { status?: string | null } | null) =>
          c && isCheckInProgress(c.status),
      )?.status ??
      runs[0]?.status ??
      null;
    // Label: **workflow** commit (displayTitle is usually the commit subject)
    const workflowName = wr.workflow?.name?.trim() || 'workflow';
    const title =
      wr.displayTitle?.trim() &&
      wr.displayTitle.trim() !== workflowName
        ? wr.displayTitle.trim()
        : '';
    byId.set(wr.id, {
      key: wr.id,
      runId: wr.id,
      databaseId: wr.databaseId ?? null,
      runNumber: wr.runNumber ?? null,
      title,
      workflowName,
      event: wr.event ?? '',
      status,
      conclusion: suite.conclusion ?? null,
      branch: suite.branch?.name ?? null,
      updatedAt: wr.updatedAt ?? suite.updatedAt ?? null,
      githubUrl: wr.url ?? null,
      source,
    });
  };

  const target = data.repository?.defaultBranchRef?.target;
  if (target && target.__typename === 'Commit' && 'history' in target) {
    for (const commit of target.history?.nodes ?? []) {
      if (!commit) continue;
      for (const suite of commit.checkSuites?.nodes ?? []) {
        addSuite(suite, commit.abbreviatedOid ?? 'commit');
      }
    }
  }

  for (const pr of data.repository?.pullRequests?.nodes ?? []) {
    if (!pr) continue;
    const commit = pr.commits?.nodes?.[0]?.commit;
    if (!commit) continue;
    for (const suite of commit.checkSuites?.nodes ?? []) {
      addSuite(suite, `PR #${pr.number}`);
    }
  }

  return [...byId.values()].sort((a, b) => {
    const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    return tb - ta;
  });
}
