import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonKanban } from "@/components/ui/SkeletonKanban"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-7 w-52" />
      <Skeleton className="h-4 w-72 -mt-4" />

      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-md" />
        ))}
      </div>

      <SkeletonKanban />
    </div>
  )
}
