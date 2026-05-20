export default function EmployeeLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-64 bg-muted rounded animate-pulse" />
      <div className="h-4 w-48 bg-muted rounded animate-pulse" />
      <div className="h-10 w-72 bg-muted rounded animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 w-full bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
