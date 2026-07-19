/**
 * Multi-account auth (`gh auth switch`–like). SPEC §9.
 * Roster: localStorage. Active me-key: sessionStorage.
 */

const ROSTER_KEY = 'ghweb.accounts';
const ACTIVE_KEY = 'ghweb.activeMeKey';
/** Legacy single-PAT (session only); one-shot promote. */
const LEGACY_PAT_KEY = 'ghweb.pat';
const LEGACY_PAT_KEY_OLD = 'gitweb.pat';

export const DEFAULT_GRAPHQL_BASE = 'https://api.github.com/graphql';

export type StoredAccount = {
  /** Profile-shaped id, e.g. github.com/lucasew */
  meKey: string;
  token: string;
  /** GraphQL endpoint */
  baseUrl: string;
  login: string;
  name?: string | null;
  avatarUrl?: string | null;
  viewerId?: string | null;
  /** True when last probe/use got 401 */
  unhealthy?: boolean;
  addedAt: number;
  lastUsedAt?: number;
};

export type ViewerSnapshot = {
  id: string;
  login: string;
  name?: string | null;
  avatarUrl?: string | null;
};

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): void {
  localStorage.setItem(key, value);
}

function lsRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function ssGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function ssSet(key: string, value: string): void {
  sessionStorage.setItem(key, value);
}

function ssRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Normalize to absolute GraphQL URL. */
export function normalizeGraphqlUrl(input: string): string {
  let s = input.trim().replace(/\/+$/, '');
  if (!s) return DEFAULT_GRAPHQL_BASE;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  // bare api.github.com → graphql
  if (/^https?:\/\/api\.github\.com$/i.test(s)) return DEFAULT_GRAPHQL_BASE;
  if (/\/graphql$/i.test(s)) return s;
  // GHE often given as host or host/api
  if (/\/api$/i.test(s)) return `${s}/graphql`;
  return `${s}/api/graphql`;
}

/** REST API root for fetch (no trailing slash). */
export function restBaseFromGraphql(gqlUrl: string): string {
  const u = normalizeGraphqlUrl(gqlUrl);
  if (/api\.github\.com/i.test(u)) return 'https://api.github.com';
  if (/\/api\/graphql$/i.test(u)) return u.replace(/\/api\/graphql$/i, '/api/v3');
  if (/\/graphql$/i.test(u)) return u.replace(/\/graphql$/i, '');
  return u;
}

/** Web host for me-key (no scheme), e.g. github.com */
export function webHostFromGraphql(gqlUrl: string): string {
  try {
    const u = new URL(normalizeGraphqlUrl(gqlUrl));
    if (u.hostname === 'api.github.com') return 'github.com';
    return u.host;
  } catch {
    return 'github.com';
  }
}

/**
 * Browser origin for “Open on GitHub” / permalinks (scheme + host, no path).
 * github.com GraphQL → `https://github.com`; GHE keeps the GraphQL scheme + web host.
 */
export function webOriginFromGraphql(gqlUrl: string): string {
  try {
    const u = new URL(normalizeGraphqlUrl(gqlUrl));
    const host = u.hostname === 'api.github.com' ? 'github.com' : u.host;
    return `${u.protocol}//${host}`;
  } catch {
    return 'https://github.com';
  }
}

/** Active account web origin (github.com or GHE). */
export function getWebOrigin(): string {
  return webOriginFromGraphql(getGraphqlUrl());
}

export function meKeyFrom(gqlUrl: string, login: string): string {
  return `${webHostFromGraphql(gqlUrl)}/${login}`;
}

export function listAccounts(): StoredAccount[] {
  migrateLegacyPat();
  try {
    const raw = lsGet(ROSTER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRoster(accounts: StoredAccount[]): void {
  lsSet(ROSTER_KEY, JSON.stringify(accounts));
}

export function getAccount(meKey: string): StoredAccount | null {
  return listAccounts().find((a) => a.meKey === meKey) ?? null;
}

export function getActiveMeKey(): string | null {
  migrateLegacyPat();
  const key = ssGet(ACTIVE_KEY);
  if (!key) return null;
  if (!getAccount(key)) {
    ssRemove(ACTIVE_KEY);
    return null;
  }
  return key;
}

export function getActiveAccount(): StoredAccount | null {
  const key = getActiveMeKey();
  return key ? getAccount(key) : null;
}

/** Active PAT (compat for callers). */
export function getToken(): string | null {
  return getActiveAccount()?.token ?? null;
}

export function getGraphqlUrl(): string {
  return getActiveAccount()?.baseUrl ?? DEFAULT_GRAPHQL_BASE;
}

export function getRestBase(): string {
  const acc = getActiveAccount();
  return restBaseFromGraphql(acc?.baseUrl ?? DEFAULT_GRAPHQL_BASE);
}

export function hasToken(): boolean {
  return Boolean(getToken());
}

export function setActiveMeKey(meKey: string): void {
  ssSet(ACTIVE_KEY, meKey);
}

/**
 * One-shot: session PAT → roster + active (same promote trick as key renames).
 */
function migrateLegacyPat(): void {
  try {
    let pat = ssGet(LEGACY_PAT_KEY);
    if (!pat) {
      pat = ssGet(LEGACY_PAT_KEY_OLD);
    }
    if (!pat?.trim()) return;

    const roster = (() => {
      try {
        const raw = lsGet(ROSTER_KEY);
        if (!raw) return [] as StoredAccount[];
        const p = JSON.parse(raw) as StoredAccount[];
        return Array.isArray(p) ? p : [];
      } catch {
        return [] as StoredAccount[];
      }
    })();

    // Only promote if no roster yet
    if (roster.length === 0) {
      saveRoster([
        {
          meKey: '_migrating',
          token: pat.trim(),
          baseUrl: DEFAULT_GRAPHQL_BASE,
          login: '_migrating',
          addedAt: Date.now(),
        },
      ]);
      ssSet(ACTIVE_KEY, '_migrating');
    }

    ssRemove(LEGACY_PAT_KEY);
    ssRemove(LEGACY_PAT_KEY_OLD);
  } catch {
    /* ignore */
  }
}

/**
 * Finish migrate: if active is _migrating, fetch viewer and rewrite entry.
 * Call from App boot before rendering.
 */
export async function finishMigrationIfNeeded(): Promise<void> {
  migrateLegacyPat();
  const active = getActiveAccount();
  if (!active || active.meKey !== '_migrating') return;
  try {
    const viewer = await fetchViewer(active.token, active.baseUrl);
    const meKey = meKeyFrom(active.baseUrl, viewer.login);
    const next: StoredAccount = {
      meKey,
      token: active.token,
      baseUrl: normalizeGraphqlUrl(active.baseUrl),
      login: viewer.login,
      name: viewer.name,
      avatarUrl: viewer.avatarUrl,
      viewerId: viewer.id,
      addedAt: active.addedAt,
      lastUsedAt: Date.now(),
    };
    saveRoster([next]);
    setActiveMeKey(meKey);
  } catch {
    // Drop bad migrate
    saveRoster([]);
    ssRemove(ACTIVE_KEY);
  }
}

const VIEWER_QUERY = `query GhwebViewerProbe {
  viewer {
    id
    login
    name
    avatarUrl
  }
}`;

export async function fetchViewer(
  token: string,
  baseUrl: string,
): Promise<ViewerSnapshot> {
  const url = normalizeGraphqlUrl(baseUrl);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Github-Next-Global-ID': '1',
    },
    body: JSON.stringify({ query: VIEWER_QUERY }),
  });
  if (res.status === 401) {
    throw new Error('Unauthorized — token invalid or revoked');
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    data?: { viewer?: ViewerSnapshot | null };
    errors?: { message?: string }[];
  };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message ?? 'error').join('; '));
  }
  const v = json.data?.viewer;
  if (!v?.login || !v.id) {
    throw new Error('No viewer in response (check token scopes / CORS)');
  }
  return v;
}

export type AddAccountResult =
  | { ok: true; account: StoredAccount }
  | { ok: false; error: string };

/** Upsert by meKey, set active. Caller should full-refresh. */
export async function addAccountAndActivate(
  token: string,
  baseUrlInput: string = DEFAULT_GRAPHQL_BASE,
): Promise<AddAccountResult> {
  const baseUrl = normalizeGraphqlUrl(baseUrlInput);
  const tok = token.trim();
  if (!tok) return { ok: false, error: 'Token is required' };

  let viewer: ViewerSnapshot;
  try {
    viewer = await fetchViewer(tok, baseUrl);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const meKey = meKeyFrom(baseUrl, viewer.login);
  const now = Date.now();
  const prev = listAccounts().filter((a) => a.meKey !== meKey && a.meKey !== '_migrating');
  const account: StoredAccount = {
    meKey,
    token: tok,
    baseUrl,
    login: viewer.login,
    name: viewer.name,
    avatarUrl: viewer.avatarUrl,
    viewerId: viewer.id,
    unhealthy: false,
    addedAt:
      listAccounts().find((a) => a.meKey === meKey)?.addedAt ?? now,
    lastUsedAt: now,
  };
  saveRoster([...prev, account]);
  setActiveMeKey(meKey);
  return { ok: true, account };
}

export type SwitchResult =
  | { ok: true }
  | { ok: false; error: string; unhealthy?: boolean };

/** Probe then set active. Caller full-refreshes on ok. */
export async function switchAccount(meKey: string): Promise<SwitchResult> {
  const acc = getAccount(meKey);
  if (!acc) return { ok: false, error: 'Account not found' };

  try {
    const viewer = await fetchViewer(acc.token, acc.baseUrl);
    const roster = listAccounts().map((a) =>
      a.meKey === meKey
        ? {
            ...a,
            login: viewer.login,
            name: viewer.name,
            avatarUrl: viewer.avatarUrl,
            viewerId: viewer.id,
            unhealthy: false,
            lastUsedAt: Date.now(),
            // meKey stable even if login rename — keep stored meKey
          }
        : a,
    );
    saveRoster(roster);
    setActiveMeKey(meKey);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const unhealthy = /unauthorized|401|revoked/i.test(msg);
    if (unhealthy) {
      saveRoster(
        listAccounts().map((a) =>
          a.meKey === meKey ? { ...a, unhealthy: true } : a,
        ),
      );
    }
    return { ok: false, error: msg, unhealthy };
  }
}

/** Remove one account from roster. If it was active, clear active. */
export function removeAccount(meKey: string): void {
  saveRoster(listAccounts().filter((a) => a.meKey !== meKey));
  if (ssGet(ACTIVE_KEY) === meKey) ssRemove(ACTIVE_KEY);
}

/** Sign out active: remove from roster + clear session. */
export function signOutActive(): void {
  const key = getActiveMeKey();
  if (key) removeAccount(key);
  ssRemove(ACTIVE_KEY);
}

/** @deprecated use signOutActive */
export function clearToken(): void {
  signOutActive();
}

/** @deprecated use addAccountAndActivate */
export function setToken(token: string): void {
  // Sync path no longer valid; keep for compile — prefer addAccountAndActivate
  void token;
  throw new Error('Use addAccountAndActivate()');
}

/** Mark active unhealthy and clear session (e.g. mid-session 401). */
export function markActiveUnhealthyAndClearSession(): void {
  const key = getActiveMeKey();
  if (key) {
    saveRoster(
      listAccounts().map((a) =>
        a.meKey === key ? { ...a, unhealthy: true } : a,
      ),
    );
  }
  ssRemove(ACTIVE_KEY);
}

export function forgetAllAccounts(): void {
  lsRemove(ROSTER_KEY);
  ssRemove(ACTIVE_KEY);
  ssRemove(LEGACY_PAT_KEY);
  ssRemove(LEGACY_PAT_KEY_OLD);
}

/** Full refresh helper (switch / add / sign-out). */
export function hardRefresh(href?: string): void {
  if (href != null) {
    window.location.assign(href);
  } else {
    window.location.reload();
  }
}
