import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminGuard } from './AdminGuard';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </AdminGuard>
  );
}
