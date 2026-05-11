import { Skeleton } from "@/components/ui/skeleton"

function KanbanCardSkeleton() {
  return (
    <div className="bg-background border border-border rounded-lg p-3 space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-5 w-full mt-2" />
      <Skeleton className="h-3 w-24 mt-2" />
      <Skeleton className="h-3 w-32 mt-3" />
    </div>
  )
}

export function SkeletonKanban() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, col) => (
        <div key={col} className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <KanbanCardSkeleton />
          <KanbanCardSkeleton />
          {col === 0 && <KanbanCardSkeleton />}
        </div>
      ))}
    </div>
  )
}
