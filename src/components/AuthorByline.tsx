import { cn } from '@/lib/cls';

export type AuthorInfo = {
  login?: string | null;
  avatarUrl?: string | null;
  /** Display name when author is a User */
  name?: string | null;
} | null;

type Props = {
  author: AuthorInfo;
  /** e.g. createdAt string to show after the identity */
  meta?: string;
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * Avatar + display name + @handle for issue/PR authors (and similar).
 */
export function AuthorByline({
  author,
  meta,
  size = 'sm',
  className,
}: Props) {
  const login = author?.login ?? 'ghost';
  const name = author?.name?.trim() || null;
  const avatar = author?.avatarUrl ?? null;
  const px = size === 'md' ? 'w-10 h-10' : 'w-7 h-7';
  const text = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <div className={cn('avatar shrink-0', !avatar && 'placeholder')}>
        <div
          className={cn(
            'rounded-full bg-neutral text-neutral-content',
            px,
          )}
        >
          {avatar ? (
            <img src={avatar} alt="" />
          ) : (
            <span className="text-[10px]">{login[0]?.toUpperCase() ?? '?'}</span>
          )}
        </div>
      </div>
      <div className={cn('min-w-0 leading-tight', text)}>
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
          {name ? (
            <span className="font-medium truncate max-w-[12rem]">{name}</span>
          ) : null}
          <span className={cn('truncate', name ? 'opacity-60' : 'font-medium')}>
            @{login}
          </span>
        </div>
        {meta ? <div className="opacity-50 truncate">{meta}</div> : null}
      </div>
    </div>
  );
}

/** GraphQL selection for Actor + User.name (paste into author { ... }). */
export const AUTHOR_FIELDS = `
  login
  avatarUrl(size: 48)
  ... on User {
    name
  }
`;
