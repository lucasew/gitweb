import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/cls';
import 'github-markdown-css/github-markdown.css';

// External anchors from GitHub HTML → new tab (SPEC)
if (typeof window !== 'undefined' && !('_gitwebPurifyHook' in DOMPurify)) {
  (DOMPurify as unknown as { _gitwebPurifyHook?: boolean })._gitwebPurifyHook =
    true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

type Props = {
  /** GitHub-rendered HTML (`bodyHTML`) preferred */
  html?: string | null;
  /** Fallback when HTML not available (e.g. optimistic comment) */
  text?: string | null;
  className?: string;
  empty?: string;
};

/**
 * Renders GitHub Flavored Markdown using server HTML from GraphQL (`bodyHTML`).
 * Sanitizes with DOMPurify. Falls back to plain text if only markdown source is present.
 */
export function GithubMarkdown({
  html,
  text,
  className,
  empty = '_No content_',
}: Props) {
  const safe = useMemo(() => {
    if (html && html.trim()) {
      return DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ADD_ATTR: ['target', 'rel'],
      });
    }
    if (text && text.trim()) {
      // Plain-text fallback (optimistic UI / non-HTML fields)
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<p>${escaped.replace(/\n/g, '<br />')}</p>`;
    }
    return DOMPurify.sanitize(`<p><em>${empty}</em></p>`);
  }, [html, text, empty]);

  return (
    <div
      className={cn(
        'markdown-body gitweb-markdown min-w-0 w-full max-w-none',
        className,
      )}
      // GitHub bodyHTML + DOMPurify
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
