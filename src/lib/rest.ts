import { getToken } from '@/lib/auth';

const API = 'https://api.github.com';

export type RestPullFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
};

export async function fetchPullFiles(
  owner: string,
  repo: string,
  number: number,
): Promise<RestPullFile[]> {
  const token = getToken();
  if (!token) throw new Error('Not signed in');

  const out: RestPullFile[] = [];
  let page = 1;
  for (;;) {
    const res = await fetch(
      `${API}/repos/${owner}/${repo}/pulls/${number}/files?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`REST pull files ${res.status}: ${body.slice(0, 400)}`);
    }
    const batch = (await res.json()) as RestPullFile[];
    out.push(...batch);
    if (batch.length < 100) break;
    page += 1;
    if (page > 20) break;
  }
  return out;
}

export type RepoDirEntry = {
  name: string;
  path: string;
  type: 'file' | 'dir';
};

const dirCache = new Map<string, RepoDirEntry[] | null>();

function contentsHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function contentsUrl(
  owner: string,
  repo: string,
  ref: string,
  path: string,
): string {
  if (!path) {
    return `${API}/repos/${owner}/${repo}/contents?ref=${encodeURIComponent(ref)}`;
  }
  const encPath = path
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/');
  return `${API}/repos/${owner}/${repo}/contents/${encPath}?ref=${encodeURIComponent(ref)}`;
}

/**
 * List a directory (or null if missing / not a dir). Cached per owner/repo@ref:path.
 */
export async function listRepoDir(
  owner: string,
  repo: string,
  ref: string,
  dirPath: string,
): Promise<RepoDirEntry[] | null> {
  const key = `${owner}/${repo}@${ref}:${dirPath || '/'}`;
  if (dirCache.has(key)) return dirCache.get(key) ?? null;

  const res = await fetch(contentsUrl(owner, repo, ref, dirPath), {
    headers: contentsHeaders(),
  });
  if (res.status === 404) {
    dirCache.set(key, null);
    return null;
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`REST contents ${res.status}: ${body.slice(0, 300)}`);
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    // path is a file, not a directory
    dirCache.set(key, null);
    return null;
  }
  const entries: RepoDirEntry[] = data
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const o = raw as { name?: string; path?: string; type?: string };
      if (!o.name || !o.path) return null;
      if (o.type === 'dir')
        return { name: o.name, path: o.path, type: 'dir' as const };
      if (o.type === 'file')
        return { name: o.name, path: o.path, type: 'file' as const };
      return null;
    })
    .filter(Boolean) as RepoDirEntry[];

  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  dirCache.set(key, entries);
  return entries;
}

/**
 * Probe whether a path exists on a ref. Returns blob/tree or null if missing.
 * Empty path = repository root tree.
 */
export async function probeRepoPath(
  owner: string,
  repo: string,
  ref: string,
  path: string,
): Promise<'blob' | 'tree' | null> {
  if (!path) return 'tree';

  const res = await fetch(contentsUrl(owner, repo, ref, path), {
    headers: contentsHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`REST contents ${res.status}: ${body.slice(0, 300)}`);
  }
  const data: unknown = await res.json();
  if (Array.isArray(data)) return 'tree';
  if (
    data &&
    typeof data === 'object' &&
    'type' in data &&
    (data as { type: string }).type === 'file'
  ) {
    return 'blob';
  }
  if (
    data &&
    typeof data === 'object' &&
    'type' in data &&
    (data as { type: string }).type === 'dir'
  ) {
    return 'tree';
  }
  return null;
}

/** Full GFM via GitHub REST (for README/blob .md — no bodyHTML on Blob). */
export async function renderMarkdownGfm(
  markdown: string,
  context?: string,
): Promise<string> {
  const token = getToken();
  if (!token) throw new Error('Not signed in');

  const res = await fetch('https://api.github.com/markdown', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      text: markdown,
      mode: 'gfm',
      ...(context ? { context } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Markdown render ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.text();
}

export type JobLogsResult =
  | { kind: 'ok'; text: string }
  | {
      /** Logs not uploaded yet (typical while the job is still running). */
      kind: 'pending';
      message: string;
    }
  | { kind: 'error'; message: string };

function isLogsNotReady(status: number, body: string): boolean {
  if (status === 404) return true;
  // GitHub redirects to Azure blob; empty/missing while job runs
  if (/BlobNotFound|The specified blob does not exist/i.test(body)) return true;
  if (status === 302 || status === 301) return false;
  return false;
}

/**
 * Job logs for a GitHub Actions check run / job (REST — GraphQL has no log body).
 * Follows redirects to the signed log URL.
 *
 * While a job is in progress the API often 404s / BlobNotFound — that is
 * expected; use `kind: 'pending'` and open the GitHub job page for live logs.
 */
export async function fetchActionsJobLogs(
  owner: string,
  repo: string,
  jobId: number,
): Promise<JobLogsResult> {
  const token = getToken();
  if (!token) return { kind: 'error', message: 'Not signed in' };

  try {
    const res = await fetch(
      `${API}/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        redirect: 'follow',
      },
    );
    const body = await res.text();
    if (!res.ok) {
      if (isLogsNotReady(res.status, body)) {
        return {
          kind: 'pending',
          message:
            'Job logs are not available via the API until the job finishes. Use the GitHub link for live logs.',
        };
      }
      return {
        kind: 'error',
        message: `Job logs ${res.status}: ${body.slice(0, 300)}`,
      };
    }
    // Successful HTTP but body is Azure error XML (some edge cases)
    if (isLogsNotReady(200, body) && body.includes('<Error>')) {
      return {
        kind: 'pending',
        message:
          'Log blob not ready yet. Use the GitHub link for live logs.',
      };
    }
    return { kind: 'ok', text: body };
  } catch (e) {
    return {
      kind: 'error',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

/** GitHub Actions UI for a workflow run (gap stubs). */
export function githubActionsRunUrl(
  owner: string,
  repo: string,
  runDatabaseId: number | null | undefined,
): string {
  if (runDatabaseId != null) {
    return `https://github.com/${owner}/${repo}/actions/runs/${runDatabaseId}`;
  }
  return `https://github.com/${owner}/${repo}/actions`;
}

/** GitHub Actions job page (pretty logs UI). */
export function githubActionsJobUrl(
  owner: string,
  repo: string,
  runDatabaseId: number | null | undefined,
  jobId: number | null | undefined,
): string | null {
  if (runDatabaseId == null || jobId == null) return null;
  return `https://github.com/${owner}/${repo}/actions/runs/${runDatabaseId}/job/${jobId}`;
}

/**
 * Raw job logs API URL (redirects to a short-lived signed URL when fetched with auth).
 * Useful as a “download / raw” link for tools that send the PAT.
 */
export function githubActionsJobLogsApiUrl(
  owner: string,
  repo: string,
  jobId: number,
): string {
  return `${API}/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`;
}

export function githubActionsHomeUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}/actions`;
}
