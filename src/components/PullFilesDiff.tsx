import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { DiffFile, DiffView, DiffModeEnum, SplitSide } from '@git-diff-view/react';
import '@git-diff-view/react/styles/diff-view-pure.css';
import { graphql, useLazyLoadQuery, useMutation } from 'react-relay';
import { Link } from '@tanstack/react-router';
import { fetchPullFiles, type RestPullFile } from '@/lib/rest';
import { LoadingBlock } from '@/components/LoadingBlock';
import { ErrorBanner } from '@/components/ErrorBanner';
import {
  getResolvedTheme,
  subscribeTheme,
  type ResolvedTheme,
} from '@/lib/theme';
import { ExternalLink } from '@/components/ExternalLink';
import { useToast } from '@/lib/toast';
import type { PullFilesDiffThreadMutation } from './__generated__/PullFilesDiffThreadMutation.graphql';
import type { PullFilesDiffViewedQuery } from './__generated__/PullFilesDiffViewedQuery.graphql';
import type { PullFilesDiffMarkViewedMutation } from './__generated__/PullFilesDiffMarkViewedMutation.graphql';
import type { PullFilesDiffUnmarkViewedMutation } from './__generated__/PullFilesDiffUnmarkViewedMutation.graphql';
import { cn } from '@/lib/cls';
import { GithubMarkdown } from '@/components/GithubMarkdown';
import { normalizeGithubPatch, patchFileNames } from '@/lib/githubPatch';
import { langFromPath } from '@/lib/diffLang';
import { githubBlobUrl } from '@/lib/permalinks';
import { STORE_AND_NETWORK } from '@/lib/relayPolicy';

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
    state?: string | null;
    authorLogin: string | null;
  }>;
};

type Props = {
  owner: string;
  name: string;
  number: number;
  pullRequestId: string;
  /** PR head commit SHA or branch name — blob permalinks for changed files */
  headRef: string;
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

/** GitHub “Viewed” checklist — same state as github.com PR Files */
const viewedQuery = graphql`
  query PullFilesDiffViewedQuery(
    $owner: String!
    $name: String!
    $number: Int!
  ) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        id
        files(first: 100) {
          totalCount
          nodes {
            path
            viewerViewedState
          }
        }
      }
    }
  }
`;

const markViewedMutation = graphql`
  mutation PullFilesDiffMarkViewedMutation(
    $pullRequestId: ID!
    $path: String!
  ) {
    markFileAsViewed(input: { pullRequestId: $pullRequestId, path: $path }) {
      pullRequest {
        id
      }
    }
  }
`;

const unmarkViewedMutation = graphql`
  mutation PullFilesDiffUnmarkViewedMutation(
    $pullRequestId: ID!
    $path: String!
  ) {
    unmarkFileAsViewed(input: { pullRequestId: $pullRequestId, path: $path }) {
      pullRequest {
        id
      }
    }
  }
`;

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
        className="textarea textarea-bordered textarea-sm w-full min-h-20 bg-base-100 text-base-content border-base-300"
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
  const [theme, setTheme] = useState<ResolvedTheme>(() => getResolvedTheme());
  useEffect(() => subscribeTheme(setTheme), []);

  const { diffFile, parseError } = useMemo(() => {
    try {
      // Prefer new path for renames; map extension → hljs id (rs→rust, etc.)
      const lang = langFromPath(newName || oldName || path);
      const file = new DiffFile(
        oldName,
        '',
        newName,
        '',
        hunks,
        lang,
        lang,
      );
      file.initTheme(theme);
      // init() = initRaw (compose content from hunks) + initSyntax (lowlight, all langs)
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
      extendData={extendData}
      diffViewMode={mode === 'split' ? DiffModeEnum.Split : DiffModeEnum.Unified}
      diffViewTheme={theme}
      /* no wrap: long lines use library overflow-x-auto scroll containers */
      diffViewWrap={false}
      diffViewHighlight
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
                  <div className="flex flex-wrap items-center gap-1.5 text-xs opacity-60">
                    <span>@{c.authorLogin ?? 'ghost'}</span>
                    {c.state === 'PENDING' ? (
                      <span className="badge badge-xs badge-outline badge-warning opacity-100">
                        Pending
                      </span>
                    ) : null}
                  </div>
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
  owner,
  name,
  headRef,
  threads,
  onThreadsChanged,
  expanded,
  viewed,
  onToggleExpand,
  onToggleViewed,
  viewedBusy,
}: {
  file: RestPullFile;
  mode: 'unified' | 'split';
  canReview: boolean;
  pullRequestId: string;
  owner: string;
  name: string;
  headRef: string;
  threads: ReviewThreadSummary[];
  onThreadsChanged?: () => void;
  expanded: boolean;
  viewed: boolean;
  onToggleExpand: () => void;
  onToggleViewed: (next: boolean) => void;
  viewedBusy: boolean;
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

  const blobParams = {
    owner,
    name,
    ref: headRef,
    _splat: file.filename,
  } as const;

  // Ignore clicks on links/controls so collapse does not steal navigation
  const onTitleActivate = (e: MouseEvent | KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t?.closest('a, button, input, label, select, textarea')) return;
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return;
    if ('key' in e) e.preventDefault();
    onToggleExpand();
  };

  // daisyUI collapse (controlled): collapse-arrow + collapse-open/close
  return (
    <div
      className={cn(
        'ghweb-diff-collapse collapse collapse-arrow border border-base-300 bg-base-100 rounded-box w-full min-w-0 max-w-full',
        expanded ? 'collapse-open' : 'collapse-close',
        viewed && !expanded && 'opacity-80',
      )}
    >
      <div
        role="button"
        tabIndex={0}
        className="collapse-title min-h-0 py-2 pe-10 bg-base-200 sticky top-0 z-10 flex flex-nowrap items-center gap-2 min-w-0 overflow-hidden"
        aria-expanded={expanded}
        onClick={onTitleActivate}
        onKeyDown={onTitleActivate}
      >
        <Link
          to="/$owner/$name/blob/$ref/$"
          params={blobParams}
          className="font-mono text-sm min-w-0 flex-1 truncate link link-hover"
          title={`View ${file.filename} at PR head`}
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
          ↗
        </ExternalLink>
        <div className="flex items-center gap-2 shrink-0 text-xs tabular-nums">
          <span className="text-success">+{file.additions}</span>
          <span className="text-error">-{file.deletions}</span>
          {fileThreads.length ? (
            <span className="badge badge-sm badge-ghost">
              {fileThreads.length} thread{fileThreads.length === 1 ? '' : 's'}
            </span>
          ) : null}
          <label
            className="label cursor-pointer gap-1.5 py-0 px-1"
            title="Mark file as viewed (synced with GitHub)"
          >
            <span className="label-text text-xs opacity-70">Viewed</span>
            <input
              type="checkbox"
              className="checkbox checkbox-xs checkbox-success"
              checked={viewed}
              disabled={viewedBusy}
              onChange={(e) => onToggleViewed(e.target.checked)}
            />
          </label>
        </div>
      </div>
      <div className="collapse-content px-0 min-w-0 max-w-full">
        {expanded ? (
          <div className="ghweb-diff-scroll w-full min-w-0 max-w-full">
            {!file.patch ? (
              <div className="alert alert-info text-sm m-2">
                No patch for <code className="text-xs">{file.filename}</code>{' '}
                (binary or too large).
              </div>
            ) : hunks.length === 0 ? (
              <div className="alert alert-warning text-sm m-2">
                Could not parse unified diff for this file (empty or non-text
                patch).
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
        ) : null}
      </div>
    </div>
  );
}

export function PullFilesDiff({
  owner,
  name,
  number,
  pullRequestId,
  headRef,
  canReview,
  threads,
  onThreadsChanged,
}: Props) {
  const toast = useToast();
  const [files, setFiles] = useState<RestPullFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'unified' | 'split'>('unified');
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(true);
  /** path → expanded; default = !viewed (GitHub: viewed files start collapsed) */
  const [expandOverride, setExpandOverride] = useState<
    Record<string, boolean>
  >({});
  /** path → viewed optimistic overlay on top of GQL */
  const [viewedOverride, setViewedOverride] = useState<
    Record<string, boolean>
  >({});
  const [viewedBusyPath, setViewedBusyPath] = useState<string | null>(null);

  const viewedData = useLazyLoadQuery<PullFilesDiffViewedQuery>(
    viewedQuery,
    { owner, name, number },
    STORE_AND_NETWORK,
  );

  const gqlViewed = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const n of viewedData.repository?.pullRequest?.files?.nodes ?? []) {
      if (n?.path) map[n.path] = n.viewerViewedState === 'VIEWED';
    }
    return map;
  }, [viewedData]);

  const isViewed = useCallback(
    (path: string) =>
      path in viewedOverride ? viewedOverride[path]! : Boolean(gqlViewed[path]),
    [gqlViewed, viewedOverride],
  );

  const isExpanded = useCallback(
    (path: string) =>
      path in expandOverride ? expandOverride[path]! : !isViewed(path),
    [expandOverride, isViewed],
  );

  const [commitMarkViewed] =
    useMutation<PullFilesDiffMarkViewedMutation>(markViewedMutation);
  const [commitUnmarkViewed] =
    useMutation<PullFilesDiffUnmarkViewedMutation>(unmarkViewedMutation);

  const setFileViewed = useCallback(
    (path: string, next: boolean) => {
      setViewedOverride((prev) => ({ ...prev, [path]: next }));
      // GitHub collapses on view, expands on unview
      setExpandOverride((prev) => ({ ...prev, [path]: !next }));
      setViewedBusyPath(path);
      const vars = { pullRequestId, path };
      if (next) {
        commitMarkViewed({
          variables: vars,
          onCompleted: () => setViewedBusyPath(null),
          onError: (e) => {
            setViewedOverride((prev) => ({ ...prev, [path]: false }));
            setViewedBusyPath(null);
            toast.error('Could not mark viewed', e.message);
          },
        });
      } else {
        commitUnmarkViewed({
          variables: vars,
          onCompleted: () => setViewedBusyPath(null),
          onError: (e) => {
            setViewedOverride((prev) => ({ ...prev, [path]: true }));
            setViewedBusyPath(null);
            toast.error('Could not unmark viewed', e.message);
          },
        });
      }
    },
    [commitMarkViewed, commitUnmarkViewed, pullRequestId, toast],
  );

  const toggleExpand = useCallback(
    (path: string) => {
      setExpandOverride((prev) => ({
        ...prev,
        [path]: !(path in prev ? prev[path]! : !isViewed(path)),
      }));
    },
    [isViewed],
  );

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    // Keep previous file list painted while refreshing (no blank flash)
    void fetchPullFiles(owner, name, number)
      .then((f) => {
        setFiles(f);
        setOpenPath((prev) =>
          prev && f.some((x) => x.filename === prev)
            ? prev
            : (f[0]?.filename ?? null),
        );
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setLoading(false));
  }, [owner, name, number]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !files) {
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

  const viewedCount = files.filter((f) => isViewed(f.filename)).length;

  return (
    <div
      className={cn(
        'flex flex-col lg:flex-row gap-0 lg:gap-3 w-full min-h-[70vh]',
        loading && 'opacity-80',
      )}
    >
      <aside className="w-full lg:w-72 shrink-0 border border-base-300 rounded-box bg-base-200/40 max-h-[40vh] lg:max-h-[calc(100vh-8rem)] overflow-auto lg:sticky lg:top-2">
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
          <div
            className="w-full text-xs opacity-60 tabular-nums"
            title="Synced with GitHub viewerViewedState"
          >
            {viewedCount}/{files.length} viewed
          </div>
        </div>
        {/* daisyUI list — full-width rows (menu is fit-content) */}
        <ul className="list w-full rounded-none bg-transparent py-1">
          {files.map((f) => {
            const n = threads.filter((t) => t.path === f.filename).length;
            const viewed = isViewed(f.filename);
            return (
              <li
                key={f.filename}
                className={cn(
                  'list-row py-1.5 px-2 rounded-field',
                  !showAll && openPath === f.filename && 'bg-base-300',
                  viewed && 'opacity-70',
                )}
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs checkbox-success shrink-0 self-center"
                  checked={viewed}
                  disabled={viewedBusyPath === f.filename}
                  title={viewed ? 'Mark as unviewed' : 'Mark as viewed'}
                  aria-label={
                    viewed
                      ? `Mark ${f.filename} unviewed`
                      : `Mark ${f.filename} viewed`
                  }
                  onChange={(e) => setFileViewed(f.filename, e.target.checked)}
                />
                <button
                  type="button"
                  className="list-col-grow font-mono text-xs truncate min-w-0 text-start bg-transparent border-0 p-0 cursor-pointer hover:underline"
                  onClick={() => {
                    setOpenPath(f.filename);
                    if (!isExpanded(f.filename)) {
                      setExpandOverride((prev) => ({
                        ...prev,
                        [f.filename]: true,
                      }));
                    }
                    if (showAll) {
                      const el = document.querySelector(
                        `[data-diff-path="${CSS.escape(f.filename)}"]`,
                      );
                      el?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }
                  }}
                >
                  {f.filename}
                </button>
                <span className="flex items-center gap-1 shrink-0 self-center tabular-nums text-xs">
                  <span className="text-success">+{f.additions}</span>
                  <span className="text-error">-{f.deletions}</span>
                  {n ? <span className="badge badge-xs">{n}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="p-2 text-xs opacity-60 border-t border-base-300">
          {canReview
            ? 'Viewed checklist syncs with GitHub. Click + on a line to comment.'
            : 'Read-only: open PR to leave line comments.'}{' '}
          <ExternalLink
            className="link"
            href={`https://github.com/${owner}/${name}/pull/${number}/files`}
          >
            GitHub
          </ExternalLink>
        </div>
      </aside>

      <div className="flex-1 min-w-0 max-w-full space-y-4 w-full overflow-x-hidden">
        {visible.map((f) => (
          <div
            key={f.filename}
            data-diff-path={f.filename}
            className="w-full min-w-0 max-w-full"
          >
            <FileDiff
              file={f}
              mode={mode}
              canReview={canReview}
              pullRequestId={pullRequestId}
              owner={owner}
              name={name}
              headRef={headRef}
              threads={threads}
              onThreadsChanged={onThreadsChanged}
              expanded={isExpanded(f.filename)}
              viewed={isViewed(f.filename)}
              onToggleExpand={() => toggleExpand(f.filename)}
              onToggleViewed={(next) => setFileViewed(f.filename, next)}
              viewedBusy={viewedBusyPath === f.filename}
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
