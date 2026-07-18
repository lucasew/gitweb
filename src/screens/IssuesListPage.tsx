import { graphql, useLazyLoadQuery } from 'react-relay';
import { Link } from '@tanstack/react-router';
import { AuthorByline } from '@/components/AuthorByline';
import type { IssuesListPageQuery } from './__generated__/IssuesListPageQuery.graphql';

const query = graphql`
  query IssuesListPageQuery($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      issues(
        first: 40
        states: OPEN
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          id
          number
          title
          updatedAt
          author {
            login
            avatarUrl(size: 40)
            ... on User {
              name
            }
          }
          labels(first: 5) {
            nodes {
              id
              name
              color
            }
          }
        }
      }
    }
  }
`;

type Props = { owner: string; name: string };

export function IssuesListPage({ owner, name }: Props) {
  const data = useLazyLoadQuery<IssuesListPageQuery>(query, { owner, name });
  const issues = data.repository?.issues.nodes ?? [];

  return (
    <div className="p-3 md:p-4 max-w-3xl">
      <h1 className="text-lg font-semibold mb-3">Issues</h1>
      <ul className="card bg-base-100 border border-base-300 divide-y divide-base-300 dense-list">
        {issues.map((issue) => {
          if (!issue) return null;
          return (
            <li key={issue.id} className="dense-row">
              <Link
                to="/$owner/$name/issues/$number"
                params={{ owner, name, number: String(issue.number) }}
                className="link link-hover font-medium"
              >
                <span className="opacity-50 font-normal">#{issue.number}</span>{' '}
                {issue.title}
              </Link>
              <div className="mt-1">
                <AuthorByline
                  author={
                    issue.author
                      ? {
                          login: issue.author.login,
                          avatarUrl: issue.author.avatarUrl,
                          name:
                            'name' in issue.author
                              ? (issue.author.name as string | null)
                              : null,
                        }
                      : null
                  }
                  meta={new Date(issue.updatedAt).toLocaleString()}
                />
              </div>
            </li>
          );
        })}
        {!issues.length ? (
          <li className="dense-row opacity-60">No open issues</li>
        ) : null}
      </ul>
    </div>
  );
}
