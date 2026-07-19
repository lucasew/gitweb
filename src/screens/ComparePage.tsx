import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { AuthorByline } from '@/components/AuthorByline';
import { ExternalLink } from '@/components/ExternalLink';
import { FilesDiffList } from '@/components/FilesDiffList';
import { ErrorBanner } from '@/components/ErrorBanner';
import { LoadingBlock } from '@/components/LoadingBlock';
import {
  fetchCompare,
  type RestCompareResult,
} from '@/lib/rest';

type Props = {
  owner: string;
  name: string;
  base: string;
  head: string;
};

export function ComparePage({ owner, name, base, head }: Props) {
  const [data, setData] = useState<RestCompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    void fetchCompare(owner, name, base, head)
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when range changes
  }, [owner, name, base, head]);

  return (
    <div className="w-full min-w-0 p-[clamp(0.75rem,2vw,1.25rem)]">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">Compare</h1>
            <p className="text-sm font-mono opacity-70 break-all">
              {base}
              <span className="opacity-40"> ... </span>
              {head}
            </p>
          </div>
          {data?.html_url ? (
            <ExternalLink className="btn btn-ghost btn-sm" href={data.html_url}>
              GitHub
            </ExternalLink>
          ) : null}
        </div>

        {loading ? <LoadingBlock label="Loading compare…" /> : null}
        {error ? (
          <ErrorBanner
            title="Could not compare (REST)"
            detail={error}
            onRetry={load}
          />
        ) : null}

        {data && !loading ? (
          <>
            <div className="text-sm opacity-80 flex flex-wrap gap-3">
              <span>
                status: <span className="font-medium">{data.status}</span>
              </span>
              <span className="tabular-nums">
                {data.ahead_by} ahead · {data.behind_by} behind ·{' '}
                {data.total_commits} commit
                {data.total_commits === 1 ? '' : 's'}
              </span>
              <Link
                to="/$owner/$name/commit/$sha"
                params={{ owner, name, sha: data.merge_base_commit.sha }}
                className="link text-xs font-mono"
              >
                merge base {data.merge_base_commit.sha.slice(0, 7)}
              </Link>
            </div>

            {data.commits.length > 0 ? (
              <div className="space-y-1">
                <div className="text-xs font-medium opacity-60">Commits</div>
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {data.commits.map((c) => (
                    <li key={c.sha}>
                      <Link
                        to="/$owner/$name/commit/$sha"
                        params={{ owner, name, sha: c.sha }}
                        className="flex items-center gap-2 text-sm border border-base-300 rounded-box px-2 py-1.5 hover:bg-base-200/50"
                      >
                        <AuthorByline
                          className="min-w-0 !w-auto max-w-[10rem]"
                          author={{
                            login:
                              c.author?.login ??
                              c.commit.author?.name ??
                              'unknown',
                            avatarUrl: c.author?.avatar_url ?? null,
                            name: c.commit.author?.name ?? null,
                          }}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {c.commit.message.split('\n')[0]}
                        </span>
                        <span className="font-mono text-xs opacity-60 shrink-0">
                          {c.sha.slice(0, 7)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <FilesDiffList
              files={data.files ?? []}
              owner={owner}
              name={name}
              headRef={head}
              githubFilesUrl={data.html_url}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
