import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard } from "@/components/ui/SkeletonCard"
import { SkeletonTable } from "@/components/ui/SkeletonTable"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-4 w-64 -mt-4" />

      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="flex justify-between">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-9 w-48 rounded-md" />
      </div>

      <SkeletonTable rows={8} cols={5} />
    </div>
  )
}
