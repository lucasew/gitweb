import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { cn } from '@/lib/cls';
import { highlightFileToLines } from '@/lib/highlightCode';
import {
  ghwebBlobUrl,
  githubBlobUrl,
  parseLineHash,
  type LineRange,
} from '@/lib/permalinks';
import { useToast } from '@/lib/toast';
import {
  getResolvedTheme,
  subscribeTheme,
  type ResolvedTheme,
} from '@/lib/theme';

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
  const [theme, setTheme] = useState<ResolvedTheme>(() => getResolvedTheme());
  useEffect(() => subscribeTheme(setTheme), []);
  const { lines } = useMemo(
    () => highlightFileToLines(text, path),
    [text, path],
  );
  const [active, setActive] = useState<{ start: number; end: number } | null>(
    null,
  );
  const [menuLine, setMenuLine] = useState<number | null>(null);
  const lineMenuId = `blob-line-${useId().replace(/:/g, '')}`;
  const lineAnchor = '--blob-line-menu';
  const linePopoverRef = useRef<HTMLUListElement | null>(null);

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

  // Open shared popover after the active line gets the CSS anchor
  useEffect(() => {
    if (menuLine == null) {
      linePopoverRef.current?.hidePopover?.();
      return;
    }
    const id = requestAnimationFrame(() => {
      linePopoverRef.current?.showPopover?.();
    });
    return () => cancelAnimationFrame(id);
  }, [menuLine]);

  const copyPermalink = async (line: number, kind: 'github' | 'ghweb') => {
    const range: LineRange = { start: line };
    const url =
      kind === 'github'
        ? githubBlobUrl(owner, name, refName, path, range)
        : ghwebBlobUrl(owner, name, refName, path, range);
    const ok = await copyText(url);
    setMenuLine(null);
    linePopoverRef.current?.hidePopover?.();
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
        'ghweb-code w-full min-w-0 h-full min-h-0 flex flex-col border border-base-300 rounded-box overflow-hidden',
        theme === 'dark' ? 'ghweb-code-dark' : 'ghweb-code-light',
        className,
      )}
      data-theme-code={theme}
    >
      <div className="flex-1 min-h-0 min-w-0 overflow-auto w-full">
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
                    <button
                      type="button"
                      className="ghweb-code-linenum block w-full text-right px-2 py-0 min-w-[2.5rem] hover:text-primary cursor-pointer"
                      style={
                        {
                          minWidth: `${width + 2}ch`,
                          ...(menuLine === n
                            ? { anchorName: lineAnchor }
                            : {}),
                        } as CSSProperties
                      }
                      aria-label={`Line ${n}, copy permalink`}
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuLine((cur) => (cur === n ? null : n));
                        setActive({ start: n, end: n });
                      }}
                    >
                      {n}
                    </button>
                  </td>
                  <td className="ghweb-code-content px-3 py-0 align-top whitespace-pre">
                    <code
                      className="hljs bg-transparent"
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

      {/* Shared daisyUI popover for line permalinks */}
      <ul
        ref={linePopoverRef}
        id={lineMenuId}
        popover="auto"
        className={cn(
          'dropdown menu menu-sm',
          'w-56 rounded-box bg-base-100 p-1 shadow-lg border border-base-300',
        )}
        style={
          {
            positionAnchor: lineAnchor,
            positionArea: 'right span-bottom',
            positionTryFallbacks: 'flip-inline, flip-block',
          } as CSSProperties
        }
        onToggle={(e) => {
          if (
            e.currentTarget instanceof HTMLElement &&
            !e.currentTarget.matches(':popover-open')
          ) {
            setMenuLine(null);
          }
        }}
      >
        <li className="menu-title px-2 py-1">
          <span>
            {menuLine != null ? `Line ${menuLine}` : 'Copy permalink'}
          </span>
        </li>
        <li>
          <button
            type="button"
            disabled={menuLine == null}
            onClick={() =>
              menuLine != null && void copyPermalink(menuLine, 'ghweb')
            }
          >
            ghweb link
          </button>
        </li>
        <li>
          <button
            type="button"
            disabled={menuLine == null}
            onClick={() =>
              menuLine != null && void copyPermalink(menuLine, 'github')
            }
          >
            GitHub link
          </button>
        </li>
      </ul>
    </div>
  );
}
