import { Outlet, Link } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminGuard } from './AdminGuard';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBackNavigation } from '@/hooks/useBackNavigation';

/** Thin back-navigation bar rendered at the top of every admin content pane. */
function AdminBackBar() {
  const { t } = useTranslation();
  const { backTo, backLabel } = useBackNavigation();

  // Show only on admin sub-pages (backTo === '/admin/dashboard').
  // On admin dashboard, sidebar footer already has "Back to App" — avoid duplication.
  if (backTo !== '/admin/dashboard') return null;

  return (
    <div className="mb-6 flex items-center">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${t('common.back')}: ${backLabel}`}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        {backLabel}
      </Link>
    </div>
  );
}

function AdminPageSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64 mt-4" />
    </div>
  );
}

export function AdminLayout() {
  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<AdminPageSkeleton />}>
            <div className="container py-6 px-6 max-w-7xl">
              <AdminBackBar />
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </AdminGuard>
  );
}
