import { createLowlight, all } from 'lowlight';
import { langFromPath } from '@/lib/diffLang';
import { ensureSvelteHighlight } from '@/lib/registerSvelteHighlight';

const lowlight = createLowlight(all);
ensureSvelteHighlight((g) => lowlight.register(g));

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type HastNode = {
  type: string;
  value?: string;
  tagName?: string;
  properties?: { className?: string[] | string; [k: string]: unknown };
  children?: HastNode[];
};

/**
 * Highlight a whole file and return one HTML fragment per line (hljs classes).
 * Multi-line tokens are split so each line is self-contained spans.
 */
export function highlightFileToLines(
  code: string,
  path: string,
): { lang: string; lines: string[] } {
  const lang = langFromPath(path);
  const rawLines = code.split('\n');
  // trailing empty from final newline is OK (matches split)

  let tree: HastNode;
  try {
    if (lang && lang !== 'plaintext' && lowlight.registered(lang)) {
      tree = lowlight.highlight(lang, code) as unknown as HastNode;
    } else {
      tree = lowlight.highlightAuto(code) as unknown as HastNode;
    }
  } catch {
    return { lang, lines: rawLines.map(escapeHtml) };
  }

  const out: string[] = [''];

  const walk = (node: HastNode, openClasses: string[]) => {
    if (node.type === 'text') {
      const value = node.value ?? '';
      const parts = value.split('\n');
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) out.push('');
        let html = escapeHtml(parts[i]!);
        for (let c = openClasses.length - 1; c >= 0; c--) {
          const cls = openClasses[c]!;
          if (cls) html = `<span class="${cls}">${html}</span>`;
        }
        out[out.length - 1] += html;
      }
      return;
    }
    if (node.type === 'element') {
      const raw = node.properties?.className;
      const cls = Array.isArray(raw)
        ? raw.join(' ')
        : typeof raw === 'string'
          ? raw
          : '';
      const next = cls ? [...openClasses, cls] : openClasses;
      for (const child of node.children ?? []) walk(child as HastNode, next);
      return;
    }
    if (node.type === 'root') {
      for (const child of node.children ?? []) walk(child as HastNode, openClasses);
    }
  };

  walk(tree, []);

  // Align length with source split
  while (out.length < rawLines.length) out.push('');
  return { lang, lines: out.slice(0, rawLines.length) };
}
