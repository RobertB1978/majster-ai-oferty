import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

interface SkeletonBlockProps {
  /** Width of the block, e.g. "w-full", "w-48" — defaults to full width */
  width?: string;
  /** Height of the block, e.g. "h-4", "h-10" — defaults to h-4 */
  height?: string;
  className?: string;
}

/**
 * Single rectangular skeleton placeholder.
 *
 * @example
 * <SkeletonBlock height="h-6" width="w-3/4" />
 */
function SkeletonBlock({ width = "w-full", height = "h-4", className }: SkeletonBlockProps) {
  return <Skeleton className={cn(height, width, className)} />;
}

interface SkeletonListProps {
  /** Number of skeleton rows to render */
  rows?: number;
  /** Extra classes applied to the wrapping container */
  className?: string;
  /** Extra classes applied to each row */
  rowClassName?: string;
}

/**
 * Vertical list of skeleton rows — useful as a placeholder for list/table views.
 *
 * @example
 * <SkeletonList rows={5} />
 */
function SkeletonList({ rows = 3, className, rowClassName }: SkeletonListProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)} role="status" aria-label="Loading…">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {/* Leading avatar placeholder */}
          <Skeleton className={cn("h-10 w-10 shrink-0 rounded-full", rowClassName)} />
          {/* Text lines */}
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2 opacity-60" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading content, please wait.</span>
    </div>
  );
}

export { Skeleton, SkeletonBlock, SkeletonList };
