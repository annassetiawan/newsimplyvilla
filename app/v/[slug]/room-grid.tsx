import { Users, Bed } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatRp, isConflicting, type ReservationData, type RoomData } from './booking-shared'

interface RoomGridProps {
  rooms: RoomData[]
  reservations: ReservationData[]
  checkIn: string
  checkOut: string
  selectedRoomId: string
  datesSelected: boolean
  nights: number
}

export function RoomGrid({
  rooms,
  reservations,
  checkIn,
  checkOut,
  selectedRoomId,
  datesSelected,
  nights,
}: RoomGridProps) {
  if (rooms.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Belum ada kamar tersedia.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <h2 className="text-xl font-semibold">Kamar Tersedia</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {rooms.map((room) => {
          const busy = isConflicting(room.id, checkIn, checkOut, reservations)
          return (
            <Card
              key={room.id}
              className={cn(
                'transition-colors',
                room.status === 'OCCUPIED' && 'opacity-60',
                selectedRoomId === room.id && 'ring-2 ring-primary'
              )}
            >
              {room.photos.length > 0 && (
                <div className="aspect-video w-full overflow-hidden rounded-t-xl">
                  <img
                    src={room.photos[0]}
                    alt={room.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{room.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {room.code} · {room.type}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      room.status === 'AVAILABLE'
                        ? 'bg-green-100 text-green-700'
                        : room.status === 'OCCUPIED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                    )}
                  >
                    {room.status === 'AVAILABLE'
                      ? 'Tersedia'
                      : room.status === 'OCCUPIED'
                        ? 'Terisi'
                        : room.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {room.capacity} orang
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Bed className="h-3.5 w-3.5" />
                    {room.type}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-lg font-bold text-primary">
                    {formatRp(room.pricePerNight)}
                  </span>
                  <span className="text-xs text-muted-foreground">/ malam</span>
                </div>
                {datesSelected && nights > 0 && busy && (
                  <p className="text-xs text-destructive">
                    Tidak tersedia untuk tanggal dipilih
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
