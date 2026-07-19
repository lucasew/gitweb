import { graphql, useLazyLoadQuery } from 'react-relay';
import { STORE_AND_NETWORK } from '@/lib/relayPolicy';
import { Link } from '@tanstack/react-router';
import { ExternalLink as ExternalLinkIcon, GitFork, Star } from 'lucide-react';
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
  const data = useLazyLoadQuery<RepoPageQuery>(query, { owner, name }, STORE_AND_NETWORK);
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
    <div className="w-full min-w-0 p-[clamp(0.75rem,2vw,1.25rem)]">
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
          <span className="min-w-0 break-all">{repo.nameWithOwner}</span>
          <span className="flex items-center gap-3 text-sm font-normal opacity-70 tabular-nums shrink-0">
            <span
              className="inline-flex items-center gap-1"
              title={`${repo.stargazerCount.toLocaleString()} stars`}
            >
              <Star className="size-4 shrink-0" aria-hidden />
              <span>{repo.stargazerCount.toLocaleString()}</span>
            </span>
            <span
              className="inline-flex items-center gap-1"
              title={`${repo.forkCount.toLocaleString()} forks`}
            >
              <GitFork className="size-4 shrink-0" aria-hidden />
              <span>{repo.forkCount.toLocaleString()}</span>
            </span>
            {repo.primaryLanguage ? (
              <span
                className="inline-flex items-center gap-1.5"
                title={`Primary language: ${repo.primaryLanguage.name}`}
              >
                <span
                  className="size-2.5 rounded-full shrink-0 border border-base-content/20"
                  style={{
                    backgroundColor:
                      repo.primaryLanguage.color ?? 'var(--color-base-300)',
                  }}
                  aria-hidden
                />
                <span className="font-normal">{repo.primaryLanguage.name}</span>
              </span>
            ) : null}
            <ExternalLink
              href={repo.url}
              className="inline-flex items-center gap-1 link link-hover opacity-100"
              title="Open on GitHub"
              aria-label="Open on GitHub"
            >
              <ExternalLinkIcon className="size-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline font-normal">GitHub</span>
            </ExternalLink>
          </span>
        </h1>
        {repo.description ? (
          <p className="opacity-80 text-sm mt-1">{repo.description}</p>
        ) : null}
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
