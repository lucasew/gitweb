const TOKEN_KEY = 'ghweb.pat';
/** Pre-rename key; migrated on read. */
const LEGACY_TOKEN_KEY = 'gitweb.pat';

export function getToken(): string | null {
  try {
    const cur = sessionStorage.getItem(TOKEN_KEY);
    if (cur) return cur;
    const legacy = sessionStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacy) {
      sessionStorage.setItem(TOKEN_KEY, legacy);
      sessionStorage.removeItem(LEGACY_TOKEN_KEY);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token.trim());
  try {
    sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  try {
    sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function hasToken(): boolean {
  return Boolean(getToken());
}
