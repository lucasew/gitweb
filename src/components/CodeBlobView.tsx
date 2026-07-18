import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cls';
import { highlightFileToLines } from '@/lib/highlightCode';
import {
  ghwebBlobUrl,
  githubBlobUrl,
  parseLineHash,
  type LineRange,
} from '@/lib/permalinks';
import { useToast } from '@/lib/toast';
import { getThemePreference } from '@/lib/theme';

type Props = {
  owner: string;
  name: string;
  /** Branch, tag, or commit SHA used in blob URLs */
  refName: string;
  path: string;
  text: string;
  className?: string;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function themeMode(): 'light' | 'dark' {
  const pref = getThemePreference();
  if (pref === 'light' || pref === 'dark') return pref;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Full-width source view: line numbers, syntax highlight, line-permalink menu.
 */
export function CodeBlobView({
  owner,
  name,
  refName,
  path,
  text,
  className,
}: Props) {
  const toast = useToast();
  const theme = themeMode();
  const { lines } = useMemo(
    () => highlightFileToLines(text, path),
    [text, path],
  );
  const [active, setActive] = useState<{ start: number; end: number } | null>(
    null,
  );
  const [menuLine, setMenuLine] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Scroll + select from #L12 or #L12-L20
  useEffect(() => {
    const range = parseLineHash(window.location.hash);
    if (!range) return;
    setActive(range);
    requestAnimationFrame(() => {
      document
        .getElementById(`LC${range.start}`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }, [path, text]);

  useEffect(() => {
    if (menuLine == null) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuLine(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuLine(null);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuLine]);

  const copyPermalink = async (line: number, kind: 'github' | 'ghweb') => {
    const range: LineRange = { start: line };
    const url =
      kind === 'github'
        ? githubBlobUrl(owner, name, refName, path, range)
        : ghwebBlobUrl(owner, name, refName, path, range);
    const ok = await copyText(url);
    setMenuLine(null);
    if (ok) {
      toast.info(
        kind === 'github' ? 'GitHub permalink copied' : 'ghweb permalink copied',
        url,
      );
      // Reflect selection in URL without navigation
      const hash = `#L${line}`;
      if (window.location.hash !== hash) {
        history.replaceState(null, '', `${window.location.pathname}${hash}`);
      }
      setActive({ start: line, end: line });
    } else {
      toast.error('Copy failed', url);
    }
  };

  const width = String(lines.length).length;

  return (
    <div
      className={cn(
        'ghweb-code w-full min-w-0 flex-1 border border-base-300 rounded-box overflow-hidden',
        theme === 'dark' ? 'ghweb-code-dark' : 'ghweb-code-light',
        className,
      )}
      data-theme-code={theme}
    >
      <div className="overflow-auto max-h-[calc(100vh-6.5rem)] w-full">
        <table className="w-full border-collapse text-xs font-mono leading-5">
          <tbody>
            {lines.map((html, i) => {
              const n = i + 1;
              const selected =
                active != null && n >= active.start && n <= active.end;
              return (
                <tr
                  key={n}
                  id={`LC${n}`}
                  className={cn(
                    'group',
                    selected && 'ghweb-code-line-active',
                  )}
                >
                  <td className="ghweb-code-gutter select-none align-top sticky left-0 z-[1] w-px whitespace-nowrap">
                    <div className="relative" ref={menuLine === n ? menuRef : undefined}>
                      <button
                        type="button"
                        className="ghweb-code-linenum block w-full text-right px-2 py-0 min-w-[2.5rem] hover:text-primary cursor-pointer"
                        style={{ minWidth: `${width + 2}ch` }}
                        aria-label={`Line ${n}, copy permalink`}
                        onClick={(e) => {
                          e.preventDefault();
                          setMenuLine((cur) => (cur === n ? null : n));
                          setActive({ start: n, end: n });
                        }}
                      >
                        {n}
                      </button>
                      {menuLine === n ? (
                        <ul className="menu menu-sm bg-base-100 border border-base-300 rounded-box shadow-lg absolute left-full top-0 ml-1 z-30 w-56 p-1">
                          <li className="menu-title px-2 py-1">
                            <span>Copy permalink</span>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => void copyPermalink(n, 'ghweb')}
                            >
                              ghweb link
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => void copyPermalink(n, 'github')}
                            >
                              GitHub link
                            </button>
                          </li>
                        </ul>
                      ) : null}
                    </div>
                  </td>
                  <td className="ghweb-code-content px-3 py-0 align-top whitespace-pre">
                    <code
                      className="hljs bg-transparent"
                      // highlighted spans only
                      dangerouslySetInnerHTML={{
                        __html: html || ' ',
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
