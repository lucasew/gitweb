import { describe, expect, it } from 'vitest';
import { highlightFileToLines } from '../highlightCode';

describe('highlightFileToLines', () => {
  it('returns one highlighted line per source line for typescript', () => {
    const code = ['const x = 1;', 'function f() {', '  return x;', '}'].join(
      '\n',
    );
    const { lines, lang } = highlightFileToLines(code, 'src/a.ts');
    expect(lang).toBe('typescript');
    expect(lines).toHaveLength(4);
    expect(lines.some((l) => l.includes('hljs') || l.includes('const'))).toBe(
      true,
    );
  });

  it('highlights svelte (registered third-party grammar)', () => {
    const code = [
      '<script>',
      '  let count = 0;',
      '</script>',
      '<button on:click={() => count += 1}>{count}</button>',
    ].join('\n');
    const { lang, lines } = highlightFileToLines(code, 'Counter.svelte');
    expect(lang).toBe('svelte');
    expect(lines).toHaveLength(4);
    expect(lines.some((l) => l.includes('hljs') || l.includes('script'))).toBe(
      true,
    );
  });
});
