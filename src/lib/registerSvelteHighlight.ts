/**
 * Svelte is not bundled in highlight.js / lowlight `all`.
 * Register the third-party grammar on our lowlight instance and on
 * @git-diff-view/lowlight (used by DiffFile).
 */
import type { LanguageFn } from 'lowlight';
import registerSvelte from 'highlightjs-svelte';
import { highlighter } from '@git-diff-view/lowlight';

function extractSvelteLang(): LanguageFn | null {
  let fn: LanguageFn | null = null;
  registerSvelte({
    registerLanguage(_name: string, language: LanguageFn) {
      fn = language;
    },
  });
  return fn;
}

const svelteLang = extractSvelteLang();

export function ensureSvelteHighlight(
  register: (grammars: Record<string, LanguageFn>) => void,
): void {
  if (!svelteLang) return;
  register({ svelte: svelteLang });
}

// Diff view highlighter (shared singleton)
if (svelteLang && !highlighter.hasRegisteredCurrentLang('svelte')) {
  highlighter.getHighlighterEngine().register({ svelte: svelteLang });
}
