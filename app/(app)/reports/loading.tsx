import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard } from "@/components/ui/SkeletonCard"
import { SkeletonTable } from "@/components/ui/SkeletonTable"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-4 w-64 -mt-4" />

      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-12 w-full mt-2" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <Skeleton className="h-5 w-40" />
      <SkeletonTable rows={5} cols={5} />
    </div>
  )
}
