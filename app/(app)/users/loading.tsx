import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonTable } from "@/components/ui/SkeletonTable"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-4 w-48 -mt-4" />

      <div className="flex gap-3">
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <SkeletonTable rows={6} cols={5} />
    </div>
  )
}
