import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-4 w-56 -mt-4" />

      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-8 gap-2">
          <Skeleton className="h-8 w-24" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-8 gap-2">
            <Skeleton className="h-12 w-24" />
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
