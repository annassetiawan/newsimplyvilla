import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard() {
  return (
    <div className="bg-background border border-border rounded-lg p-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-24 mt-2" />
      <Skeleton className="h-3 w-20 mt-2" />
    </div>
  )
}
