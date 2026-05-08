import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard } from "@/components/ui/SkeletonCard"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-4 w-56 -mt-4" />

      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-8 gap-2">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-8 gap-2">
            <div className="flex items-center gap-2 p-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} className="h-16 w-full rounded-md" />
            ))}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
