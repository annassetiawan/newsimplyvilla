import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6">
      <Skeleton className="h-7 w-56 mb-2" />
      <Skeleton className="h-4 w-64 mb-6" />

      <div className="flex gap-6">
        <div className="w-48 space-y-2 flex-shrink-0">
          <Skeleton className="h-4 w-24 mb-4" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>

        <div className="flex-1 space-y-4">
          <Skeleton className="h-44 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
