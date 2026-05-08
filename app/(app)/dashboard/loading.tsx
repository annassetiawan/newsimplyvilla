import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard } from "@/components/ui/SkeletonCard"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-4 w-64 -mt-4" />

      <div className="grid grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-40 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  )
}
