/**
 * Page-level skeleton screens for Dashboard, Projects, Clients, and Finance.
 * These replace generic spinners with content-shaped placeholders so the
 * layout is visible while data loads, reducing perceived load time.
 */

import { LoadingCard } from '@/components/ui/loading-screen';

// ---------------------------------------------------------------------------
// Dashboard skeleton
// ---------------------------------------------------------------------------

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-border/50 bg-card p-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-48 bg-muted rounded-lg" />
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
          <div className="h-10 w-36 bg-muted rounded-lg" />
        </div>
      </div>

      {/* Quote creation hub skeleton */}
      <div className="rounded-xl border-2 border-primary/10 bg-card p-6 sm:p-8 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="flex flex-wrap gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 w-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>

      {/* Status breakdown + recent projects */}
      <div className="space-y-4">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-card border border-border/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Recent projects skeleton */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <div className="h-5 w-36 bg-muted rounded animate-pulse" />
        </div>
        <div className="divide-y divide-border/50">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-4 flex items-center gap-4 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Projects list skeleton
// ---------------------------------------------------------------------------

export function ProjectsListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/50 bg-card p-4 animate-pulse"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-6 w-24 bg-muted rounded-full" />
              <div className="h-9 w-20 bg-muted rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Clients grid skeleton
// ---------------------------------------------------------------------------

export function ClientsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/50 bg-card p-6 animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="flex gap-1 shrink-0">
                <div className="h-8 w-8 bg-muted rounded" />
                <div className="h-8 w-8 bg-muted rounded" />
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-muted rounded shrink-0" />
                <div className="h-4 w-28 bg-muted rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-muted rounded shrink-0" />
                <div className="h-4 w-36 bg-muted rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-muted rounded shrink-0" />
                <div className="h-4 w-44 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
