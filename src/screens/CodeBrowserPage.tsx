import { graphql, useLazyLoadQuery } from 'react-relay';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { CodeBrowserPageQuery } from './__generated__/CodeBrowserPageQuery.graphql';
import { ExternalLink } from '@/components/ExternalLink';
import { GithubMarkdown } from '@/components/GithubMarkdown';
import { renderMarkdownGfm } from '@/lib/rest';
import { LoadingBlock } from '@/components/LoadingBlock';

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

  if (!obj) {
    return (
      <div className="p-[clamp(0.75rem,2vw,1.25rem)] alert alert-warning">
        Not found: {expression}.{' '}
        <ExternalLink
          className="link"
          href={`https://github.com/${owner}/${name}/${mode}/${refName}/${path}`}
        >
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
          <ExternalLink
            className="link"
            href={`https://github.com/${owner}/${name}/blob/${refName}/${path}`}
          >
            Open on GitHub
          </ExternalLink>
        </div>
      );
    }
    const text = obj.text ?? '';
    if (text.length > MAX_TEXT) {
      return (
        <div className="p-[clamp(0.75rem,2vw,1.25rem)] alert alert-warning">
          File too large to render in gitweb ({text.length} chars).{' '}
          <ExternalLink
            className="link"
            href={`https://github.com/${owner}/${name}/blob/${refName}/${path}`}
          >
            Open on GitHub
          </ExternalLink>
        </div>
      );
    }
    const isMd = /\.(md|markdown|mdx)$/i.test(path);
    return (
      <div className="p-[clamp(0.75rem,2vw,1.25rem)] w-full min-w-0 space-y-2">
        <div className="text-sm opacity-60 font-mono break-all">
          {refName}:{path}
        </div>
        {isMd ? (
          <div className="border border-base-300 rounded-box p-[clamp(0.75rem,2vw,1.25rem)] w-full min-w-0">
            <MarkdownBlob text={text} context={`${owner}/${name}`} />
          </div>
        ) : (
          <pre className="bg-base-200 border border-base-300 rounded-box p-3 text-xs overflow-auto max-h-[min(70vh,40rem)] w-full">
            <code>{text}</code>
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="p-[clamp(0.75rem,2vw,1.25rem)]">Unsupported object type.</div>
  );
}
