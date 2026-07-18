import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cls';
import { appPathForObject } from '@/lib/repoPath';

type Props = {
  owner: string;
  name: string;
  refName: string;
  /** Repo-relative path, may be empty (repo root) */
  path: string;
  /** Last segment is a file (blob) — not a tree link */
  isBlob?: boolean;
  /** Dense chrome style for TopBar */
  dense?: boolean;
  className?: string;
};

/**
 * Breadcrumb for `ref / a / b / file.ext` under a repo.
 * Intermediate segments open the tree; the final blob name is plain text.
 *
 * Uses absolute path strings (not param templates) so blob `_splat` never
 * leaks into the branch / intermediate tree links.
 */
export function PathBreadcrumb({
  owner,
  name,
  refName,
  path,
  isBlob = false,
  dense = false,
  className,
}: Props) {
  const parts = path.split('/').filter(Boolean);
  const chevron = dense ? 'size-3.5' : 'size-3.5';
  const text = dense ? 'text-xs' : 'text-sm';
  const linkCls = dense
    ? 'btn btn-ghost btn-xs px-1 h-7 min-h-0 font-mono font-normal max-w-[10rem] truncate'
    : 'link link-hover font-mono';
  const treeRootHref = appPathForObject(owner, name, refName, '', 'tree');

  return (
    <nav
      aria-label="Path"
      className={cn(
        'flex flex-wrap items-center gap-x-0.5 gap-y-0.5 min-w-0',
        text,
        !dense && 'font-mono',
        className,
      )}
    >
      <Link
        to={treeRootHref}
        className={cn(
          linkCls,
          !dense && 'opacity-80 shrink-0',
          dense && 'opacity-80 shrink-0',
        )}
        title={`Tree at ${refName}`}
      >
        {refName}
      </Link>

      {parts.map((seg, i) => {
        const isLast = i === parts.length - 1;
        const subPath = parts.slice(0, i + 1).join('/');
        const crumbIsBlob = isBlob && isLast;
        const treeHref = appPathForObject(owner, name, refName, subPath, 'tree');

        return (
          <span
            key={subPath}
            className="inline-flex items-center gap-0.5 min-w-0"
          >
            <ChevronRight
              className={cn(chevron, 'opacity-40 shrink-0')}
              aria-hidden
            />
            {crumbIsBlob ? (
              <span
                className={cn(
                  'font-medium truncate min-w-0 font-mono',
                  dense && 'px-1 max-w-[12rem]',
                )}
                title={seg}
              >
                {seg}
              </span>
            ) : (
              <Link
                to={treeHref}
                className={cn(
                  linkCls,
                  'truncate min-w-0',
                  isLast ? 'font-medium opacity-100' : 'opacity-80',
                )}
                title={subPath}
              >
                {seg}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
