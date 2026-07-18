import { useEffect, useMemo, useState } from 'react';
import { DiffView, DiffModeEnum } from '@git-diff-view/react';
import '@git-diff-view/react/styles/diff-view-pure.css';
import { fetchPullFiles, type RestPullFile } from '@/lib/rest';
import { LoadingBlock } from '@/components/LoadingBlock';
import { ErrorBanner } from '@/components/ErrorBanner';
import { getThemePreference } from '@/lib/theme';

type Props = {
  owner: string;
  name: string;
  number: number;
};

function themeMode(): 'light' | 'dark' {
  const pref = getThemePreference();
  if (pref === 'light' || pref === 'dark') return pref;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function hunksFromPatch(patch: string, filename: string): string[] {
  // git-diff-view expects hunk strings; ensure file header exists
  if (patch.startsWith('@@')) {
    return [`diff --git a/${filename} b/${filename}\n--- a/${filename}\n+++ b/${filename}\n${patch}`];
  }
  return [patch];
}

export function PullFilesDiff({ owner, name, number }: Props) {
  const [files, setFiles] = useState<RestPullFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'unified' | 'split'>('unified');
  const [openPath, setOpenPath] = useState<string | null>(null);

  const load = () => {
    setError(null);
    setFiles(null);
    void fetchPullFiles(owner, name, number)
      .then((f) => {
        setFiles(f);
        setOpenPath(f[0]?.filename ?? null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, name, number]);

  const active = useMemo(
    () => files?.find((f) => f.filename === openPath) ?? null,
    [files, openPath],
  );

  if (error) {
    return (
      <ErrorBanner
        title="Could not load PR file patches (REST)"
        detail={error}
        onRetry={load}
      />
    );
  }
  if (!files) return <LoadingBlock label="Loading diffs…" />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="join">
          <button
            type="button"
            className={`btn btn-xs join-item ${mode === 'unified' ? 'btn-active' : ''}`}
            onClick={() => setMode('unified')}
          >
            Unified
          </button>
          <button
            type="button"
            className={`btn btn-xs join-item ${mode === 'split' ? 'btn-active' : ''}`}
            onClick={() => setMode('split')}
          >
            Split
          </button>
        </div>
        <span className="text-xs opacity-60">{files.length} files</span>
      </div>
      <ul className="menu menu-sm bg-base-200 rounded-box max-h-40 overflow-auto">
        {files.map((f) => (
          <li key={f.filename}>
            <button
              type="button"
              className={openPath === f.filename ? 'active' : ''}
              onClick={() => setOpenPath(f.filename)}
            >
              <span className="font-mono text-xs truncate">{f.filename}</span>
              <span className="text-success text-xs">+{f.additions}</span>
              <span className="text-error text-xs">-{f.deletions}</span>
            </button>
          </li>
        ))}
      </ul>
      {active ? (
        active.patch ? (
          <div className="border border-base-300 rounded-box overflow-auto max-h-[70vh]">
            <DiffView
              data={{
                oldFile: { fileName: active.previous_filename ?? active.filename },
                newFile: { fileName: active.filename },
                hunks: hunksFromPatch(active.patch, active.filename),
              }}
              diffViewMode={
                mode === 'split' ? DiffModeEnum.Split : DiffModeEnum.Unified
              }
              diffViewTheme={themeMode()}
              diffViewWrap
              diffViewHighlight
            />
          </div>
        ) : (
          <div className="alert alert-info text-sm">
            No patch available (binary or too large).{' '}
            <a
              className="link"
              href={`https://github.com/${owner}/${name}/pull/${number}/files`}
              target="_blank"
              rel="noreferrer"
            >
              Open on GitHub
            </a>
          </div>
        )
      ) : null}
    </div>
  );
}
