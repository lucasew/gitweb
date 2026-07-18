import { useCallback, useEffect, useMemo, useState } from 'react';
import { DiffFile, DiffView, DiffModeEnum, SplitSide } from '@git-diff-view/react';
import '@git-diff-view/react/styles/diff-view-pure.css';
import { graphql, useMutation } from 'react-relay';
import { fetchPullFiles, type RestPullFile } from '@/lib/rest';
import { LoadingBlock } from '@/components/LoadingBlock';
import { ErrorBanner } from '@/components/ErrorBanner';
import { getThemePreference } from '@/lib/theme';
import { ExternalLink } from '@/components/ExternalLink';
import { useToast } from '@/lib/toast';
import type { PullFilesDiffThreadMutation } from './__generated__/PullFilesDiffThreadMutation.graphql';
import { cn } from '@/lib/cls';
import { GithubMarkdown } from '@/components/GithubMarkdown';
import { normalizeGithubPatch, patchFileNames } from '@/lib/githubPatch';

export type ReviewThreadSummary = {
  id: string;
  path: string;
  line: number | null;
  startLine: number | null;
  diffSide: 'LEFT' | 'RIGHT';
  isResolved: boolean;
  comments: Array<{
    id: string;
    body: string;
    bodyHTML?: string | null;
    authorLogin: string | null;
  }>;
};

type Props = {
  owner: string;
  name: string;
  number: number;
  pullRequestId: string;
  canReview: boolean;
  threads: ReviewThreadSummary[];
  onThreadsChanged?: () => void;
};

const threadMutation = graphql`
  mutation PullFilesDiffThreadMutation(
    $pullRequestId: ID!
    $path: String!
    $body: String!
    $line: Int!
    $side: DiffSide!
  ) {
    addPullRequestReviewThread(
      input: {
        pullRequestId: $pullRequestId
        path: $path
        body: $body
        line: $line
        side: $side
        subjectType: LINE
      }
    ) {
      thread {
        id
        path
        line
        diffSide
        isResolved
        comments(first: 5) {
          nodes {
            id
            body
            bodyHTML
            author {
              login
            }
          }
        }
      }
    }
  }
`;

function themeMode(): 'light' | 'dark' {
  const pref = getThemePreference();
  if (pref === 'light' || pref === 'dark') return pref;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function sideToDiffSide(side: SplitSide): 'LEFT' | 'RIGHT' {
  return side === SplitSide.old ? 'LEFT' : 'RIGHT';
}

function CommentWidget({
  path,
  lineNumber,
  side,
  pullRequestId,
  onClose,
  onDone,
}: {
  path: string;
  lineNumber: number;
  side: SplitSide;
  pullRequestId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [body, setBody] = useState('');
  const [commit, inFlight] =
    useMutation<PullFilesDiffThreadMutation>(threadMutation);

  return (
    <div className="bg-base-100 border border-base-300 p-2 m-1 rounded-box space-y-2 max-w-xl">
      <div className="text-xs opacity-60 font-mono">
        {path}:{lineNumber} ({sideToDiffSide(side)})
      </div>
      <textarea
        className="textarea textarea-bordered textarea-sm w-full min-h-20"
        placeholder="Line comment (starts or continues a review thread)"
        value={body}
        autoFocus
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary btn-xs"
          disabled={!body.trim() || inFlight}
          onClick={() => {
            commit({
              variables: {
                pullRequestId,
                path,
                body: body.trim(),
                line: lineNumber,
                side: sideToDiffSide(side),
              },
              onCompleted: () => {
                toast.info('Comment added on line');
                setBody('');
                onDone();
                onClose();
              },
              onError: (e) => toast.error('Line comment failed', e.message),
            });
          }}
        >
          {inFlight ? 'Posting…' : 'Add comment'}
        </button>
        <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

type ExtendData = {
  oldFile: Record<string, { data: ReviewThreadSummary[] }>;
  newFile: Record<string, { data: ReviewThreadSummary[] }>;
};


function SafeDiffView({
  hunks,
  oldName,
  newName,
  mode,
  canReview,
  extendData,
  path,
  pullRequestId,
  onThreadsChanged,
}: {
  hunks: string[];
  oldName: string;
  newName: string;
  mode: 'unified' | 'split';
  canReview: boolean;
  extendData: ExtendData;
  path: string;
  pullRequestId: string;
  onThreadsChanged?: () => void;
}) {
  const theme = themeMode();

  const { diffFile, parseError } = useMemo(() => {
    try {
      const file = new DiffFile(oldName, '', newName, '', hunks);
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
  }, [hunks, oldName, newName, theme]);

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
      extendData={extendData}
      diffViewMode={mode === 'split' ? DiffModeEnum.Split : DiffModeEnum.Unified}
      diffViewTheme={theme}
      diffViewWrap
      diffViewHighlight={false}
      diffViewAddWidget={canReview}
      renderExtendLine={({ data: threadList }) => (
        <div className="bg-base-200/80 border-y border-base-300 px-3 py-2 space-y-2 w-full">
          {threadList.map((th) => (
            <div
              key={th.id}
              className={cn(
                'text-sm border border-base-300 rounded-box p-2 bg-base-100',
                th.isResolved && 'opacity-60',
              )}
            >
              {th.isResolved ? (
                <span className="badge badge-xs me-1">resolved</span>
              ) : null}
              {th.comments.map((c) => (
                <div key={c.id} className="mb-1 last:mb-0">
                  <span className="text-xs opacity-60">
                    @{c.authorLogin ?? 'ghost'}
                  </span>
                  <GithubMarkdown html={c.bodyHTML} text={c.body} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      renderWidgetLine={({ lineNumber, side, onClose }) => (
        <CommentWidget
          path={path}
          lineNumber={lineNumber}
          side={side}
          pullRequestId={pullRequestId}
          onClose={onClose}
          onDone={() => onThreadsChanged?.()}
        />
      )}
    />
  );
}

function FileDiff({
  file,
  mode,
  canReview,
  pullRequestId,
  threads,
  onThreadsChanged,
}: {
  file: RestPullFile;
  mode: 'unified' | 'split';
  canReview: boolean;
  pullRequestId: string;
  threads: ReviewThreadSummary[];
  onThreadsChanged?: () => void;
}) {
  const fileThreads = threads.filter((t) => t.path === file.filename);

  const extendData = useMemo(() => {
    const oldFile: Record<string, { data: ReviewThreadSummary[] }> = {};
    const newFile: Record<string, { data: ReviewThreadSummary[] }> = {};
    for (const t of fileThreads) {
      if (t.line == null) continue;
      const key = String(t.line);
      const bucket = t.diffSide === 'LEFT' ? oldFile : newFile;
      if (!bucket[key]) bucket[key] = { data: [] };
      bucket[key].data.push(t);
    }
    return { oldFile, newFile };
  }, [fileThreads]);

  if (!file.patch) {
    return (
      <div className="alert alert-info text-sm">
        No patch for <code className="text-xs">{file.filename}</code> (binary or
        too large).
      </div>
    );
  }

  const names = patchFileNames(
    file.filename,
    file.previous_filename,
    file.status,
  );
  const hunks = normalizeGithubPatch(
    file.patch,
    file.filename,
    file.previous_filename,
    file.status,
  );

  return (
    <div className="border border-base-300 rounded-box overflow-hidden w-full min-w-0">
      <div className="px-3 py-2 bg-base-200 border-b border-base-300 flex flex-wrap gap-2 items-center sticky top-0 z-10">
        <span className="font-mono text-sm break-all min-w-0">{file.filename}</span>
        <span className="text-success text-xs shrink-0">+{file.additions}</span>
        <span className="text-error text-xs shrink-0">-{file.deletions}</span>
        {fileThreads.length ? (
          <span className="badge badge-sm badge-ghost shrink-0">
            {fileThreads.length} thread{fileThreads.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
      <div className="w-full min-w-0 overflow-x-auto">
        {hunks.length === 0 ? (
          <div className="alert alert-warning text-sm m-2">
            Could not parse unified diff for this file (empty or non-text patch).
          </div>
        ) : (
          <SafeDiffView
            hunks={hunks}
            oldName={names.oldName}
            newName={names.newName}
            mode={mode}
            canReview={canReview}
            extendData={extendData}
            path={file.filename}
            pullRequestId={pullRequestId}
            onThreadsChanged={onThreadsChanged}
          />
        )}
      </div>
    </div>
  );
}

export function PullFilesDiff({
  owner,
  name,
  number,
  pullRequestId,
  canReview,
  threads,
  onThreadsChanged,
}: Props) {
  const [files, setFiles] = useState<RestPullFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'unified' | 'split'>('unified');
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(true);

  const load = useCallback(() => {
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
  }, [owner, name, number]);

  useEffect(() => {
    load();
  }, [load]);

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

  const visible = showAll
    ? files
    : files.filter((f) => f.filename === openPath);

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:gap-3 w-full min-h-[70vh]">
      <aside className="lg:w-64 shrink-0 border border-base-300 rounded-box bg-base-200/40 max-h-[40vh] lg:max-h-[calc(100vh-8rem)] overflow-auto lg:sticky lg:top-2">
        <div className="p-2 flex flex-wrap gap-1 border-b border-base-300 sticky top-0 bg-base-200 z-10">
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
          <button
            type="button"
            className={`btn btn-xs ${showAll ? 'btn-active' : ''}`}
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? 'All files' : 'One file'}
          </button>
        </div>
        <ul className="menu menu-sm p-1">
          {files.map((f) => {
            const n = threads.filter((t) => t.path === f.filename).length;
            return (
              <li key={f.filename}>
                <button
                  type="button"
                  className={cn(
                    'font-mono text-xs',
                    !showAll && openPath === f.filename && 'active',
                  )}
                  onClick={() => {
                    setOpenPath(f.filename);
                    if (showAll) {
                      const el = document.querySelector(
                        `[data-diff-path="${CSS.escape(f.filename)}"]`,
                      );
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  <span className="truncate">{f.filename}</span>
                  <span className="text-success">+{f.additions}</span>
                  <span className="text-error">-{f.deletions}</span>
                  {n ? <span className="badge badge-xs">{n}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="p-2 text-xs opacity-60 border-t border-base-300">
          {canReview
            ? 'Click + on a line to comment on that hunk.'
            : 'Read-only: open PR to leave line comments.'}{' '}
          <ExternalLink
            className="link"
            href={`https://github.com/${owner}/${name}/pull/${number}/files`}
          >
            GitHub
          </ExternalLink>
        </div>
      </aside>

      <div className="flex-1 min-w-0 space-y-4 w-full">
        {visible.map((f) => (
          <div
            key={f.filename}
            data-diff-path={f.filename}
            className="w-full"
          >
            <FileDiff
              file={f}
              mode={mode}
              canReview={canReview}
              pullRequestId={pullRequestId}
              threads={threads}
              onThreadsChanged={onThreadsChanged}
            />
          </div>
        ))}
        {!visible.length ? (
          <div className="opacity-60 text-sm">No files to show.</div>
        ) : null}
      </div>
    </div>
  );
}
