import { graphql, useLazyLoadQuery } from 'react-relay';
import { Link } from '@tanstack/react-router';
import { AuthorByline } from '@/components/AuthorByline';
import type { PullsListPageQuery } from './__generated__/PullsListPageQuery.graphql';

const query = graphql`
  query PullsListPageQuery($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      pullRequests(
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
          isDraft
        }
      }
    }
  }
`;

type Props = { owner: string; name: string };

export function PullsListPage({ owner, name }: Props) {
  const data = useLazyLoadQuery<PullsListPageQuery>(query, { owner, name });
  const prs = data.repository?.pullRequests.nodes ?? [];

  return (
    <div className="p-3 md:p-4 max-w-3xl">
      <h1 className="text-lg font-semibold mb-3">Pull requests</h1>
      <ul className="card bg-base-100 border border-base-300 divide-y divide-base-300 dense-list">
        {prs.map((pr) => {
          if (!pr) return null;
          return (
            <li key={pr.id} className="dense-row">
              <Link
                to="/$owner/$name/pull/$number"
                params={{ owner, name, number: String(pr.number) }}
                className="link link-hover font-medium"
              >
                <span className="opacity-50 font-normal">#{pr.number}</span>{' '}
                {pr.title}
              </Link>
              <div className="mt-1">
                <AuthorByline
                  author={
                    pr.author
                      ? {
                          login: pr.author.login,
                          avatarUrl: pr.author.avatarUrl,
                          name:
                            'name' in pr.author
                              ? (pr.author.name as string | null)
                              : null,
                        }
                      : null
                  }
                  meta={`${pr.isDraft ? 'draft · ' : ''}${new Date(pr.updatedAt).toLocaleString()}`}
                />
              </div>
            </li>
          );
        })}
        {!prs.length ? (
          <li className="dense-row opacity-60">No open pull requests</li>
        ) : null}
      </ul>
    </div>
  );
}
