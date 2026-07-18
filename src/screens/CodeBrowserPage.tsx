import { graphql, useLazyLoadQuery } from 'react-relay';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { CodeBrowserPageQuery } from './__generated__/CodeBrowserPageQuery.graphql';
import { ExternalLink } from '@/components/ExternalLink';
import { GithubMarkdown } from '@/components/GithubMarkdown';
import { CodeBlobView } from '@/components/CodeBlobView';
import { renderMarkdownGfm } from '@/lib/rest';
import { LoadingBlock } from '@/components/LoadingBlock';
import { githubBlobUrl } from '@/lib/permalinks';

const query = graphql`
  query CodeBrowserPageQuery(
    $owner: String!
    $name: String!
    $expression: String!
  ) {
    repository(owner: $owner, name: $name) {
      object(expression: $expression) {
        __typename
        ... on Tree {
          entries {
            name
            type
            path
          }
        }
        ... on Blob {
          text
          isBinary
          byteSize
        }
      }
    }
  }
`;

const MAX_TEXT = 512_000;

type Props = {
  owner: string;
  name: string;
  refName: string;
  path: string;
  mode: 'tree' | 'blob';
};

function MarkdownBlob({
  text,
  context,
}: {
  text: string;
  context: string;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setErr(null);
    void renderMarkdownGfm(text, context)
      .then((h) => {
        if (!cancelled) setHtml(h);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setErr(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [text, context]);

  if (err) {
    return (
      <div className="space-y-2">
        <div className="alert alert-warning text-sm">
          GFM render failed ({err}). Showing plain text.
        </div>
        <GithubMarkdown text={text} />
      </div>
    );
  }
  if (html == null) return <LoadingBlock label="Rendering markdown…" />;
  return <GithubMarkdown html={html} />;
}

export function CodeBrowserPage({ owner, name, refName, path, mode }: Props) {
  const expression = path ? `${refName}:${path}` : refName;
  const data = useLazyLoadQuery<CodeBrowserPageQuery>(query, {
    owner,
    name,
    expression,
  });
  const obj = data.repository?.object;
  const ghBlob =
    mode === 'blob' && path
      ? githubBlobUrl(owner, name, refName, path)
      : `https://github.com/${owner}/${name}/${mode}/${encodeURIComponent(refName)}${path ? `/${path}` : ''}`;

  if (!obj) {
    return (
      <div className="p-[clamp(0.75rem,2vw,1.25rem)] alert alert-warning">
        Not found: {expression}.{' '}
        <ExternalLink className="link" href={ghBlob}>
          Open on GitHub
        </ExternalLink>
      </div>
    );
  }

  if (obj.__typename === 'Tree' && 'entries' in obj) {
    return (
      <div className="p-[clamp(0.75rem,2vw,1.25rem)] w-full min-w-0">
        <div className="text-sm opacity-60 mb-2 font-mono break-all">
          {refName}:{path || '/'}
        </div>
        <ul className="card bg-base-100 border border-base-300 divide-y divide-base-300 dense-list w-full">
          {path ? (
            <li className="dense-row">
              <Link
                to="/$owner/$name/tree/$ref/$"
                params={{
                  owner,
                  name,
                  ref: refName,
                  _splat: path.split('/').slice(0, -1).join('/'),
                }}
                className="link link-hover"
              >
                ..
              </Link>
            </li>
          ) : null}
          {obj.entries?.map((e) => {
            if (!e) return null;
            const isTree = e.type === 'tree';
            return (
              <li key={e.path ?? e.name} className="dense-row">
                <Link
                  to={
                    isTree
                      ? '/$owner/$name/tree/$ref/$'
                      : '/$owner/$name/blob/$ref/$'
                  }
                  params={{
                    owner,
                    name,
                    ref: refName,
                    _splat: e.path ?? e.name,
                  }}
                  className="link link-hover"
                >
                  {e.name}
                  {isTree ? '/' : ''}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (obj.__typename === 'Blob' && 'isBinary' in obj) {
    if (obj.isBinary) {
      return (
        <div className="p-[clamp(0.75rem,2vw,1.25rem)] alert alert-info">
          Binary file ({obj.byteSize ?? '?'} bytes).{' '}
          <ExternalLink className="link" href={ghBlob}>
            Open on GitHub
          </ExternalLink>
        </div>
      );
    }
    const text = obj.text ?? '';
    if (text.length > MAX_TEXT) {
      return (
        <div className="p-[clamp(0.75rem,2vw,1.25rem)] alert alert-warning">
          File too large to render in ghweb ({text.length} chars).{' '}
          <ExternalLink className="link" href={ghBlob}>
            Open on GitHub
          </ExternalLink>
        </div>
      );
    }
    const isMd = /\.(md|markdown|mdx)$/i.test(path);

    return (
      <div className="flex flex-col w-full min-w-0 min-h-[calc(100vh-3rem)]">
        <div className="flex flex-wrap items-center gap-2 px-[clamp(0.75rem,2vw,1.25rem)] py-2 border-b border-base-300 bg-base-100 sticky top-0 z-10">
          <div className="text-sm font-mono break-all min-w-0 flex-1 opacity-80">
            {refName}:{path}
          </div>
          <ExternalLink className="btn btn-xs btn-ghost shrink-0" href={ghBlob}>
            GitHub
          </ExternalLink>
        </div>
        <div className="flex-1 min-w-0 p-[clamp(0.5rem,1.5vw,1rem)] w-full">
          {isMd ? (
            <div className="border border-base-300 rounded-box p-[clamp(0.75rem,2vw,1.25rem)] w-full min-w-0 max-w-[min(100%,48rem)] mx-auto">
              <MarkdownBlob text={text} context={`${owner}/${name}`} />
            </div>
          ) : (
            <CodeBlobView
              owner={owner}
              name={name}
              refName={refName}
              path={path}
              text={text}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-[clamp(0.75rem,2vw,1.25rem)]">Unsupported object type.</div>
  );
}
