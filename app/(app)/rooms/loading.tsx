import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-56 -mt-4" />

      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-md" />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-20 mt-2" />
            </div>
          </div>
        ))}
      </div>

      <Skeleton className="h-6 w-32 mt-4" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
