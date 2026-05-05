import { ProGate } from '@/components/ProGate'

export default function ChannelManagerPage() {
  return (
    <ProGate
      feature="Channel Manager"
      description="Sinkronisasi ketersediaan kamar secara real-time ke Booking.com, Airbnb, Agoda, dan OTA lainnya."
    >
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Channel Manager</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Real-time sync to Booking.com, Airbnb, Agoda, and 10+ OTA platforms.
          </p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-border p-16 text-center text-sm text-muted-foreground">
          Channel Manager — coming soon
        </div>
      </div>
    </ProGate>
  )
}
