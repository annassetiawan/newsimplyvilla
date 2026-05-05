import { ProGate } from '@/components/ProGate'

export default function BusinessPage() {
  return (
    <ProGate
      feature="Business"
      description="Pantau performa villa secara mendalam dengan insight revenue, tren okupansi, dan rekomendasi harga otomatis."
    >
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Advanced business analytics and revenue insights.
          </p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-border p-16 text-center text-sm text-muted-foreground">
          Business analytics — coming soon
        </div>
      </div>
    </ProGate>
  )
}
