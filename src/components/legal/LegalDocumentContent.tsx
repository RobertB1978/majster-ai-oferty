import { Skeleton } from '@/components/ui/skeleton';

interface LegalDocumentContentProps {
  content: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * Renders published legal document content as plain text.
 * Content is displayed whitespace-preserving — no HTML injection.
 * Used by public legal pages when DB content is available.
 */
export function LegalDocumentContent({
  content,
  isLoading = false,
  className = '',
}: LegalDocumentContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={`text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm ${className}`}>
      {content}
    </div>
  );
}
