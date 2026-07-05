'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RatesCalendar, type RatePlanCalendarRow } from '@/components/rooms/RatesCalendar'

interface RoomOption {
  id: string
  code: string
  name: string
}

interface Props {
  rooms: RoomOption[]
  initialRows: RatePlanCalendarRow[]
  initialStartDate: string
}

export function AvailabilityClient({ rooms, initialRows, initialStartDate }: Props) {
  const [roomFilter, setRoomFilter] = useState<string>('all')

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Rates & Availability</h1>
          <p className="text-sm text-muted-foreground">
            Atur harga harian dan buka/tutup ketersediaan lintas semua kamar.
          </p>
        </div>
        <Select value={roomFilter} onValueChange={setRoomFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Semua Kamar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kamar</SelectItem>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.code} · {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <RatesCalendar
        villaWide
        roomFilter={roomFilter === 'all' ? undefined : roomFilter}
        initialRows={initialRows}
        initialStartDate={initialStartDate}
      />
    </div>
  )
}
