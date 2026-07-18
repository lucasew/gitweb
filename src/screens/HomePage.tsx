import { graphql, useLazyLoadQuery } from 'react-relay';
import { Link } from '@tanstack/react-router';
import type { HomePageQuery } from './__generated__/HomePageQuery.graphql';

const query = graphql`
  query HomePageQuery {
    rateLimit {
      cost
      remaining
      limit
      resetAt
    }
    viewer {
      login
      name
      avatarUrl
      repositories(
        first: 30
        orderBy: { field: UPDATED_AT, direction: DESC }
        affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
        ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
      ) {
        nodes {
          id
          nameWithOwner
          name
          owner {
            login
          }
          description
          isPrivate
          updatedAt
          stargazerCount
        }
      }
    }
    reviewRequests: search(
      query: "is:open is:pr review-requested:@me"
      type: ISSUE
      first: 15
    ) {
      issueCount
      nodes {
        ... on PullRequest {
          id
          number
          title
          updatedAt
          repository {
            nameWithOwner
            owner {
              login
            }
            name
          }
        }
      }
    }
    assignedIssues: search(
      query: "is:open is:issue assignee:@me"
      type: ISSUE
      first: 15
    ) {
      issueCount
      nodes {
        ... on Issue {
          id
          number
          title
          updatedAt
          repository {
            nameWithOwner
            owner {
              login
            }
            name
          }
        }
      }
    }
  }
`;

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function HomePage() {
  const data = useLazyLoadQuery<HomePageQuery>(query, {});

  return (
    <div className="mx-auto max-w-5xl p-3 md:p-4 space-y-6 dense-list">
      {data.rateLimit && data.rateLimit.remaining < 500 ? (
        <div className="alert alert-warning text-sm py-2">
          GraphQL points remaining: {data.rateLimit.remaining}/
          {data.rateLimit.limit} (reset {fmtDate(data.rateLimit.resetAt)})
        </div>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60 mb-2">
          Triage
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body p-3 gap-1">
              <h3 className="font-medium text-sm">
                Assigned issues ({data.assignedIssues.issueCount})
              </h3>
              <ul className="divide-y divide-base-300">
                {data.assignedIssues.nodes?.filter(Boolean).length ? (
                  data.assignedIssues.nodes.map((n) => {
                    if (!n || !('number' in n) || !n.repository) return null;
                    return (
                      <li key={n.id} className="dense-row">
                        <Link
                          to="/$owner/$name/issues/$number"
                          params={{
                            owner: n.repository.owner.login,
                            name: n.repository.name,
                            number: String(n.number),
                          }}
                          className="link link-hover"
                        >
                          <span className="opacity-60 text-xs mr-1">
                            {n.repository.nameWithOwner}#{n.number}
                          </span>
                          {n.title}
                        </Link>
                      </li>
                    );
                  })
                ) : (
                  <li className="dense-row opacity-60 text-sm">None open</li>
                )}
              </ul>
            </div>
          </div>
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body p-3 gap-1">
              <h3 className="font-medium text-sm">
                Review requests ({data.reviewRequests.issueCount})
              </h3>
              <ul className="divide-y divide-base-300">
                {data.reviewRequests.nodes?.filter(Boolean).length ? (
                  data.reviewRequests.nodes.map((n) => {
                    if (!n || !('number' in n) || !n.repository) return null;
                    return (
                      <li key={n.id} className="dense-row">
                        <Link
                          to="/$owner/$name/pull/$number"
                          params={{
                            owner: n.repository.owner.login,
                            name: n.repository.name,
                            number: String(n.number),
                          }}
                          className="link link-hover"
                        >
                          <span className="opacity-60 text-xs mr-1">
                            {n.repository.nameWithOwner}#{n.number}
                          </span>
                          {n.title}
                        </Link>
                      </li>
                    );
                  })
                ) : (
                  <li className="dense-row opacity-60 text-sm">None open</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60 mb-2">
          Repositories
        </h2>
        <ul className="card bg-base-100 border border-base-300 divide-y divide-base-300">
          {data.viewer.repositories.nodes?.map((r) => {
            if (!r) return null;
            return (
              <li key={r.id} className="dense-row flex flex-wrap gap-x-3 gap-y-1">
                <Link
                  to="/$owner/$name"
                  params={{ owner: r.owner.login, name: r.name }}
                  className="link link-hover font-medium"
                >
                  {r.nameWithOwner}
                </Link>
                {r.isPrivate ? (
                  <span className="badge badge-ghost badge-sm">private</span>
                ) : null}
                {r.description ? (
                  <span className="opacity-70 text-sm grow basis-full sm:basis-auto">
                    {r.description}
                  </span>
                ) : null}
                <span className="text-xs opacity-50 ml-auto">
                  {fmtDate(r.updatedAt)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
