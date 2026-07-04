import { BedDouble } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/EmptyState'

const STATUS_STYLES = {
  OCCUPIED: {
    card: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    code: 'text-amber-800 dark:text-amber-300',
    label: 'text-amber-600 dark:text-amber-400',
    text: 'Occupied',
  },
  AVAILABLE: {
    card: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    code: 'text-green-800 dark:text-green-300',
    label: 'text-green-600 dark:text-green-400',
    text: 'Available',
  },
  CLEANING: {
    card: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    code: 'text-blue-800 dark:text-blue-300',
    label: 'text-blue-600 dark:text-blue-400',
    text: 'Cleaning',
  },
  MAINTENANCE: {
    card: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    code: 'text-red-800 dark:text-red-300',
    label: 'text-red-600 dark:text-red-400',
    text: 'Maint.',
  },
} as const

export interface RoomStatusItem {
  id: string
  code: string
  status: string
}

export function RoomStatusCard({ rooms }: { rooms: RoomStatusItem[] }) {
  const availableCount = rooms.filter((r) => r.status === 'AVAILABLE').length
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Room status</CardTitle>
          <span className="text-xs text-muted-foreground">{rooms.length} rooms</span>
        </div>
        <CardDescription>
          {availableCount} of {rooms.length} available
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <EmptyState
            icon={BedDouble}
            title="Belum ada kamar"
            description="Tambahkan kamar villa kamu untuk mulai mengelola status."
            actionLabel="Tambah kamar"
            actionHref="/rooms"
            minHeight="min-h-[160px]"
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {rooms.map((room) => {
              const s =
                STATUS_STYLES[room.status as keyof typeof STATUS_STYLES] ??
                STATUS_STYLES.AVAILABLE
              return (
                <div key={room.id} className={cn('rounded-lg border p-2.5', s.card)}>
                  <p className={cn('font-id font-bold', s.code)}>{room.code}</p>
                  <p className={cn('mt-0.5 text-[11px] font-medium', s.label)}>{s.text}</p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
