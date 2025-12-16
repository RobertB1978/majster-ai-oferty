/**
 * Loading indicator for lazy-loaded pages
 * Shows a centered spinner with proper styling
 */
export const PageLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Ładowanie...</p>
      </div>
    </div>
  );
};
