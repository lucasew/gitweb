/**
 * Read-only multi-file diff list — shared by commit detail, compare, (and
 * the same patch pipeline as PR files). No review widgets / viewed state.
 */
import { useEffect, useMemo, useState } from 'react';
import { DiffFile, DiffView, DiffModeEnum } from '@git-diff-view/react';
import '@git-diff-view/react/styles/diff-view-pure.css';
import { Link } from '@tanstack/react-router';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import type { RestPullFile } from '@/lib/rest';
import {
  getResolvedTheme,
  subscribeTheme,
  type ResolvedTheme,
} from '@/lib/theme';
import { ExternalLink } from '@/components/ExternalLink';
import { cn } from '@/lib/cls';
import { normalizeGithubPatch, patchFileNames } from '@/lib/githubPatch';
import { langFromPath } from '@/lib/diffLang';
import { githubBlobUrl } from '@/lib/permalinks';

type Props = {
  files: RestPullFile[];
  owner: string;
  name: string;
  /** Ref/SHA for blob permalinks (usually head of the range) */
  headRef: string;
  githubFilesUrl?: string;
  className?: string;
};

function SafeDiffView({
  hunks,
  oldName,
  newName,
  mode,
  path,
}: {
  hunks: string[];
  oldName: string;
  newName: string;
  mode: 'unified' | 'split';
  path: string;
}) {
  const [theme, setTheme] = useState<ResolvedTheme>(() => getResolvedTheme());
  useEffect(() => subscribeTheme(setTheme), []);

  const { diffFile, parseError } = useMemo(() => {
    try {
      const lang = langFromPath(newName || oldName || path);
      const file = new DiffFile(oldName, '', newName, '', hunks, lang, lang);
      file.initTheme(theme);
      file.init();
      file.buildSplitDiffLines();
      file.buildUnifiedDiffLines();
      if (file.unifiedLineLength === 0 && file.splitLineLength === 0) {
        return {
          diffFile: null as DiffFile | null,
          parseError: 'Parsed diff is empty' as string | null,
        };
      }
      return { diffFile: file, parseError: null as string | null };
    } catch (e) {
      return {
        diffFile: null as DiffFile | null,
        parseError: e instanceof Error ? e.message : String(e),
      };
    }
  }, [hunks, oldName, newName, path, theme]);

  if (parseError || !diffFile) {
    return (
      <div className="p-3 space-y-2">
        <div className="alert alert-warning text-sm">
          Diff viewer could not parse this patch
          {parseError ? ` (${parseError})` : ''}. Raw patch below.
        </div>
        <pre className="text-xs overflow-auto max-h-[min(40vh,24rem)] bg-base-200 p-2 rounded-box whitespace-pre-wrap">
          {hunks.join('')}
        </pre>
      </div>
    );
  }

  return (
    <DiffView
      diffFile={diffFile}
      diffViewMode={mode === 'split' ? DiffModeEnum.Split : DiffModeEnum.Unified}
      diffViewTheme={theme}
      diffViewWrap={false}
      diffViewHighlight
      diffViewAddWidget={false}
    />
  );
}

function FileBlock({
  file,
  mode,
  owner,
  name,
  headRef,
  defaultOpen,
}: {
  file: RestPullFile;
  mode: 'unified' | 'split';
  owner: string;
  name: string;
  headRef: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const names = patchFileNames(
    file.filename,
    file.previous_filename,
    file.status,
  );
  const hunks = file.patch
    ? normalizeGithubPatch(
        file.patch,
        file.filename,
        file.previous_filename,
        file.status,
      )
    : [];

  return (
    <div
      className={cn(
        'ghweb-diff-collapse collapse collapse-arrow border border-base-300 bg-base-100 rounded-box w-full min-w-0 max-w-full',
        open ? 'collapse-open' : 'collapse-close',
      )}
    >
      <div
        role="button"
        tabIndex={0}
        className="collapse-title min-h-0 py-2 pe-10 bg-base-200 sticky top-0 z-10 flex flex-nowrap items-center gap-2 min-w-0 overflow-hidden"
        aria-expanded={open}
        onClick={(e) => {
          const t = e.target as HTMLElement | null;
          if (t?.closest('a, button, input, label')) return;
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        <Link
          to="/$owner/$name/blob/$ref/$"
          params={{
            owner,
            name,
            ref: headRef,
            _splat: file.filename,
          }}
          className="font-mono text-sm min-w-0 flex-1 truncate link link-hover"
          title={file.filename}
          onClick={(e) => e.stopPropagation()}
        >
          {file.filename}
        </Link>
        <ExternalLink
          className="btn btn-ghost btn-xs shrink-0 opacity-70"
          href={githubBlobUrl(owner, name, headRef, file.filename)}
          title="Open on GitHub"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLinkIcon className="size-3.5" aria-hidden />
        </ExternalLink>
        <div className="flex items-center gap-2 shrink-0 text-xs tabular-nums">
          <span className="text-success">+{file.additions}</span>
          <span className="text-error">-{file.deletions}</span>
        </div>
      </div>
      <div className="collapse-content px-0 min-w-0 max-w-full">
        {open ? (
          <div className="ghweb-diff-scroll w-full min-w-0 max-w-full">
            {!file.patch ? (
              <div className="alert alert-info text-sm m-2">
                No patch for <code className="text-xs">{file.filename}</code>{' '}
                (binary or too large). Open on GitHub for the full diff.
              </div>
            ) : hunks.length === 0 ? (
              <div className="alert alert-warning text-sm m-2">
                Could not parse unified diff for this file.
              </div>
            ) : (
              <SafeDiffView
                hunks={hunks}
                oldName={names.oldName}
                newName={names.newName}
                mode={mode}
                path={file.filename}
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FilesDiffList({
  files,
  owner,
  name,
  headRef,
  githubFilesUrl,
  className,
}: Props) {
  const [mode, setMode] = useState<'unified' | 'split'>('unified');
  const shown = files;
  // Same spirit as PR files: cap extreme lists with honesty
  const CAP = 100;
  const capped = shown.slice(0, CAP);
  const truncated = shown.length > CAP;

  return (
    <div className={cn('space-y-3 w-full min-w-0', className)}>
      <div className="flex flex-wrap items-center gap-2">
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
        <span className="text-xs opacity-60 tabular-nums">
          {truncated
            ? `Showing ${CAP} of ${shown.length} files`
            : `${shown.length} file${shown.length === 1 ? '' : 's'}`}
        </span>
        {githubFilesUrl ? (
          <ExternalLink className="link text-xs" href={githubFilesUrl}>
            Open on GitHub
          </ExternalLink>
        ) : null}
      </div>
      {truncated ? (
        <div className="alert alert-warning text-sm">
          Large change set — showing the first {CAP} files. Use Open on GitHub
          for the full list.
        </div>
      ) : null}
      {capped.length === 0 ? (
        <p className="text-sm opacity-50">No file changes.</p>
      ) : (
        <div className="space-y-2 w-full min-w-0">
          {capped.map((f) => (
            <FileBlock
              key={f.filename + (f.previous_filename ?? '')}
              file={f}
              mode={mode}
              owner={owner}
              name={name}
              headRef={headRef}
              defaultOpen={capped.length <= 8}
            />
          ))}
        </div>
      )}
    </div>
  );
}
