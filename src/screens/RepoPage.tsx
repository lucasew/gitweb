import { graphql, useLazyLoadQuery } from 'react-relay';
import { Link } from '@tanstack/react-router';
import type { RepoPageQuery } from './__generated__/RepoPageQuery.graphql';
import { ExternalLink } from '@/components/ExternalLink';
import { GithubMarkdown } from '@/components/GithubMarkdown';
import { renderMarkdownGfm } from '@/lib/rest';
import { LoadingBlock } from '@/components/LoadingBlock';
import { useEffect, useState } from 'react';

const query = graphql`
  query RepoPageQuery($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      nameWithOwner
      description
      url
      homepageUrl
      stargazerCount
      forkCount
      primaryLanguage {
        name
        color
      }
      defaultBranchRef {
        name
        target {
          ... on Commit {
            oid
            messageHeadline
            committedDate
            tree {
              entries {
                name
                type
                path
                object {
                  ... on Blob {
                    byteSize
                  }
                }
              }
            }
          }
        }
      }
      object(expression: "HEAD:README.md") {
        ... on Blob {
          text
          isBinary
        }
      }
    }
  }
`;

type Props = { owner: string; name: string };

export function RepoPage({ owner, name }: Props) {
  const data = useLazyLoadQuery<RepoPageQuery>(query, { owner, name });
  const repo = data.repository;
  if (!repo) {
    return (
      <div className="p-4 alert alert-warning">
        Repository not found or no access: {owner}/{name}
      </div>
    );
  }

  const commit =
    repo.defaultBranchRef?.target && 'tree' in repo.defaultBranchRef.target
      ? repo.defaultBranchRef.target
      : null;
  const entries = commit?.tree?.entries ?? [];
  const readme =
    repo.object && 'text' in repo.object && !repo.object.isBinary
      ? repo.object.text
      : null;
  const branch = repo.defaultBranchRef?.name ?? 'HEAD';

  return (
    <div className="p-3 md:p-4 space-y-4 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">{repo.nameWithOwner}</h1>
        {repo.description ? (
          <p className="opacity-80 text-sm mt-1">{repo.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-2 mt-2 text-xs opacity-70">
          <span>★ {repo.stargazerCount}</span>
          <span>forks {repo.forkCount}</span>
          {repo.primaryLanguage ? (
            <span>{repo.primaryLanguage.name}</span>
          ) : null}
          <ExternalLink className="link" href={repo.url}>
            Open on GitHub
          </ExternalLink>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-0">
          <div className="px-3 py-2 text-xs opacity-60 border-b border-base-300">
            {branch}
            {commit && 'messageHeadline' in commit
              ? ` · ${commit.messageHeadline}`
              : null}
          </div>
          <ul className="divide-y divide-base-300 dense-list">
            {entries.map((e) => {
              if (!e) return null;
              const isTree = e.type === 'tree';
              return (
                <li key={e.path ?? e.name} className="dense-row">
                  {isTree ? (
                    <Link
                      to="/$owner/$name/tree/$ref/$"
                      params={{
                        owner,
                        name,
                        ref: branch,
                        _splat: e.path ?? e.name,
                      }}
                      className="link link-hover"
                    >
                      {e.name}/
                    </Link>
                  ) : (
                    <Link
                      to="/$owner/$name/blob/$ref/$"
                      params={{
                        owner,
                        name,
                        ref: branch,
                        _splat: e.path ?? e.name,
                      }}
                      className="link link-hover"
                    >
                      {e.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {readme ? (
        <article className="bg-base-100 border border-base-300 rounded-box p-[clamp(0.75rem,2vw,1.25rem)] w-full min-w-0">
          <RepoReadme htmlContext={`${owner}/${name}`} markdown={readme} />
        </article>
      ) : null}
    </div>
  );
}

function RepoReadme({
  markdown,
  htmlContext,
}: {
  markdown: string;
  htmlContext: string;
}) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let c = false;
    void renderMarkdownGfm(markdown, htmlContext).then(
      (h) => {
        if (!c) setHtml(h);
      },
      () => {
        if (!c) setHtml(null);
      },
    );
    return () => {
      c = true;
    };
  }, [markdown, htmlContext]);
  if (html == null) return <LoadingBlock label="Rendering README…" />;
  return <GithubMarkdown html={html} text={markdown} />;
}
