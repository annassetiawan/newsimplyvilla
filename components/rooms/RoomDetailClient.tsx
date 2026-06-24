'use client'

import { useState } from 'react'
import { BedDouble, Users, Wallet, Images, Tag, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RatePlanList } from './RatePlanList'
import { RatesCalendar, type RatePlanCalendarRow } from './RatesCalendar'

const STATUS_STYLE = {
  OCCUPIED: 'bg-green-500 text-white',
  AVAILABLE: 'bg-background text-muted-foreground border border-border',
  CLEANING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  MAINTENANCE: 'bg-red-500 text-white',
} as const

const STATUS_LABEL = {
  OCCUPIED: 'Occupied',
  AVAILABLE: 'Available',
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maintenance',
} as const

function fmtRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export interface RoomData {
  id: string
  code: string
  name: string
  type: string
  capacity: number
  pricePerNight: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE'
  photos: string[]
}

export interface RatePlanData {
  id: string
  name: string
  basePrice: number
  currency: string
  sellMode: string
  maxPersons: number
  isRefundable: boolean
  isActive: boolean
  roomId: string
  createdAt: string
}

interface Props {
  room: RoomData
  ratePlans: RatePlanData[]
  calendarRows: RatePlanCalendarRow[]
  calendarStartDate: string
}

type Tab = 'detail' | 'rateplans' | 'calendar'

export function RoomDetailClient({ room, ratePlans: initialRatePlans, calendarRows, calendarStartDate }: Props) {
  const [tab, setTab] = useState<Tab>('detail')
  const [ratePlans, setRatePlans] = useState(initialRatePlans)

  return (
    <div className="space-y-6">
      {/* Room header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{room.name}</h1>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                STATUS_STYLE[room.status]
              )}
            >
              {STATUS_LABEL[room.status]}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground font-mono">{room.code}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-background p-1 w-fit">
        {([
          { key: 'detail', label: 'Detail Kamar', icon: BedDouble },
          { key: 'rateplans', label: 'Rate Plans', icon: Tag },
          { key: 'calendar', label: 'Harga & Ketersediaan', icon: CalendarDays },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              tab === key
                ? 'bg-muted text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'detail' && (
        <div className="rounded-xl border border-border bg-background">
          {room.photos && room.photos.length > 0 ? (
            <div className="p-5 pb-0 flex gap-2 overflow-x-auto">
              {room.photos.map((url, i) => (
                <img key={i} src={url} alt="" className="h-48 w-64 shrink-0 rounded-xl object-cover" />
              ))}
            </div>
          ) : (
            <div className="mx-5 mt-5 h-48 rounded-xl bg-muted/40 flex items-center justify-center">
              <Images className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}

          <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <BedDouble className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipe Kamar</p>
                <p className="text-sm font-semibold">{room.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Users className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kapasitas</p>
                <p className="text-sm font-semibold">{room.capacity} tamu</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                <Wallet className="h-4.5 w-4.5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Harga / Malam</p>
                <p className="text-sm font-semibold">{fmtRp(room.pricePerNight)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'rateplans' && (
        <RatePlanList
          roomId={room.id}
          ratePlans={ratePlans}
          onRatePlansChange={setRatePlans}
        />
      )}

      {tab === 'calendar' && (
        <RatesCalendar
          roomId={room.id}
          initialRows={calendarRows}
          initialStartDate={calendarStartDate}
        />
      )}
    </div>
  )
}
