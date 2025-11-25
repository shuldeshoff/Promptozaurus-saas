interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-800 rounded ${className}`}
      style={{ animationDuration: '1.5s' }}
    />
  );
}

export function ProjectListSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ProjectEditorSkeleton() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <Skeleton className="h-6 w-1/3 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header Skeleton */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Skeleton */}
        <aside className="w-80 border-r border-gray-800 p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </aside>

        {/* Content Skeleton */}
        <div className="flex-1 p-6">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

