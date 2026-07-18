import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cls';

type Props = {
  owner: string;
  name: string;
  refName: string;
  /** Repo-relative path, may be empty (repo root) */
  path: string;
  /** Last segment is a file (blob) — not a tree link */
  isBlob?: boolean;
  className?: string;
};

/**
 * Breadcrumb for `ref / a / b / file.ext` under a repo.
 * Intermediate segments open the tree; the final blob name is plain text.
 */
export function PathBreadcrumb({
  owner,
  name,
  refName,
  path,
  isBlob = false,
  className,
}: Props) {
  const parts = path.split('/').filter(Boolean);

  return (
    <nav
      aria-label="Path"
      className={cn(
        'flex flex-wrap items-center gap-x-0.5 gap-y-1 text-sm font-mono min-w-0',
        className,
      )}
    >
      <Link
        to="/$owner/$name/tree/$ref/$"
        params={{ owner, name, ref: refName, _splat: '' }}
        className="link link-hover opacity-80 shrink-0"
        title={`Tree at ${refName}`}
      >
        {refName}
      </Link>

      {parts.map((seg, i) => {
        const isLast = i === parts.length - 1;
        const subPath = parts.slice(0, i + 1).join('/');
        const crumbIsBlob = isBlob && isLast;

        return (
          <span key={subPath} className="inline-flex items-center gap-0.5 min-w-0">
            <ChevronRight
              className="size-3.5 opacity-40 shrink-0"
              aria-hidden
            />
            {crumbIsBlob ? (
              <span className="font-medium truncate min-w-0" title={seg}>
                {seg}
              </span>
            ) : (
              <Link
                to="/$owner/$name/tree/$ref/$"
                params={{ owner, name, ref: refName, _splat: subPath }}
                className={cn(
                  'link link-hover truncate min-w-0',
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
