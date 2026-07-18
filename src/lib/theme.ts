const THEME_KEY = 'ghweb.theme';
const LEGACY_THEME_KEY = 'gitweb.theme';
const THEME_CHANGE_EVENT = 'ghweb:theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export function getThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy === 'light' || legacy === 'dark' || legacy === 'system') {
      localStorage.setItem(THEME_KEY, legacy);
      localStorage.removeItem(LEGACY_THEME_KEY);
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return 'system';
}

/** Effective light/dark from preference + OS (does not read DOM). */
export function resolveTheme(
  pref: ThemePreference = getThemePreference(),
): ResolvedTheme {
  if (pref === 'light' || pref === 'dark') return pref;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Prefer live `data-theme` on <html> (what the user sees); fall back to resolve.
 * Use this for DiffView / hljs theme classes — never raw prefers-color-scheme alone.
 */
export function getResolvedTheme(): ResolvedTheme {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
  }
  return resolveTheme();
}

export function setThemePreference(pref: ThemePreference): void {
  localStorage.setItem(THEME_KEY, pref);
  try {
    localStorage.removeItem(LEGACY_THEME_KEY);
  } catch {
    /* ignore */
  }
  applyTheme(pref);
}

export function applyTheme(pref: ThemePreference = getThemePreference()): void {
  const root = document.documentElement;
  const theme = resolveTheme(pref);
  root.setAttribute('data-theme', theme);
  // Native form controls (textarea/input/select) follow color-scheme, not daisyUI alone.
  root.style.colorScheme = theme;
  try {
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme, pref } }),
    );
  } catch {
    /* ignore */
  }
}

/** Subscribe to theme application (TopBar toggle, system change when pref=system). */
export function subscribeTheme(
  listener: (theme: ResolvedTheme) => void,
): () => void {
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<{ theme: ResolvedTheme }>).detail;
    if (detail?.theme) listener(detail.theme);
    else listener(getResolvedTheme());
  };
  window.addEventListener(THEME_CHANGE_EVENT, onCustom);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onCustom);
}

export function initTheme(): void {
  applyTheme();
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (getThemePreference() === 'system') applyTheme('system');
    });
}
