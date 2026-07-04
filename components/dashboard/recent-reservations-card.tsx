import { CalendarOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/EmptyState'

function formatRp(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
]

export interface RecentReservationItem {
  id: string
  guestName: string
  roomCode: string
  checkIn: Date
  totalAmount: number
  paymentStatus: string
}

interface RecentReservationsCardProps {
  reservations: RecentReservationItem[]
  thisMonthCount: number
}

export function RecentReservationsCard({ reservations, thisMonthCount }: RecentReservationsCardProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent reservations</CardTitle>
          <button type="button" className="text-xs font-medium text-primary hover:underline">View all</button>
        </div>
        <CardDescription>{thisMonthCount} reservasi aktif bulan ini</CardDescription>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="Belum ada reservasi"
            description="Reservasi terbaru akan tampil di sini."
            actionLabel="Tambah reservasi"
            actionHref="/front-desk"
            minHeight="min-h-[200px]"
          />
        ) : (
          <div className="space-y-4">
            {reservations.map((res, i) => (
              <div key={res.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                    AVATAR_COLORS[i % AVATAR_COLORS.length]
                  )}
                >
                  {getInitials(res.guestName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{res.guestName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-id">{res.roomCode}</span> &middot;{' '}
                    {new Date(res.checkIn).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn(
                    'text-sm font-semibold',
                    res.paymentStatus === 'PAID' ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {formatRp(res.totalAmount)}
                  </p>
                  {res.paymentStatus === 'UNPAID' && (
                    <span className="text-[10px] font-semibold text-red-500">Belum bayar</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
