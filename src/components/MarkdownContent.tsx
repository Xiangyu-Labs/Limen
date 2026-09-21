import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

// remark-breaks makes a single newline a line break. Diary entries are written
// with soft line breaks far more often than with blank lines, so without it the
// reader sees one run-on paragraph where the writer saw separate lines.
// remark-gfm adds tables, task lists, strikethrough and autolinks.
const REMARK_PLUGINS = [remarkGfm, remarkBreaks];

/**
 * The single Markdown renderer. The detail page and the editor preview share it
 * so what you see while writing matches what you get after saving.
 *
 * Raw HTML stays escaped: rehype-raw is deliberately not installed.
 */
export function MarkdownContent({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn('prose prose-lg max-w-none leading-8', className)}>
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{children}</ReactMarkdown>
    </div>
  );
}
