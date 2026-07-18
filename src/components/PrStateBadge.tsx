import { cn } from '@/lib/cls';

export type PrStateBadgeProps = {
  state: string; // OPEN | CLOSED
  merged?: boolean | null;
  isDraft?: boolean | null;
  /** Transient UI while merge mutation is in flight */
  merging?: boolean;
  className?: string;
};

/**
 * Colored PR status chip (GitHub-like: green open, gray draft, purple merged, red closed).
 */
export function PrStateBadge({
  state,
  merged,
  isDraft,
  merging,
  className,
}: PrStateBadgeProps) {
  let label: string;
  let colorClass: string;

  if (merging) {
    label = 'Merging…';
    colorClass = 'badge-warning text-warning-content';
  } else if (merged || state === 'MERGED') {
    label = 'Merged';
    // purple — not a daisyUI semantic; fixed brand-ish hues for light/dark
    // GitHub-like purple (works on light/dark base without class-based dark mode)
    colorClass = 'border-transparent bg-[#8250df] text-white';
  } else if (state === 'CLOSED') {
    label = 'Closed';
    colorClass = 'badge-error';
  } else if (isDraft) {
    label = 'Draft';
    colorClass = 'badge-ghost border border-base-300';
  } else {
    label = 'Open';
    colorClass = 'badge-success';
  }

  return (
    <span className={cn('badge badge-sm font-medium', colorClass, className)}>
      {label}
    </span>
  );
}
