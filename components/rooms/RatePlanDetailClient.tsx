'use client'

import { useState } from 'react'
import { CalendarDays, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PriceCalendar } from './PriceCalendar'
import { RestrictionForm } from './RestrictionForm'
import type { RatePlanData } from './RoomDetailClient'

export interface PriceOverrideData {
  id: string
  ratePlanId: string
  date: string
  price: number | null
  isClosed: boolean
}

export interface RestrictionData {
  id: string
  ratePlanId: string
  minStay: number
  maxStay: number | null
  closedToArrival: boolean
  closedToDeparture: boolean
}

interface Props {
  ratePlan: RatePlanData
  initialOverrides: PriceOverrideData[]
  initialRestriction: RestrictionData | null
  initialYear: number
  initialMonth: number
}

type Tab = 'calendar' | 'restrictions'

function fmtRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export function RatePlanDetailClient({
  ratePlan,
  initialOverrides,
  initialRestriction,
  initialYear,
  initialMonth,
}: Props) {
  const [tab, setTab] = useState<Tab>('calendar')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{ratePlan.name}</h1>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-semibold',
              ratePlan.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            )}
          >
            {ratePlan.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <span>Harga dasar: <span className="font-semibold text-foreground">{fmtRp(ratePlan.basePrice)}</span></span>
          <span>·</span>
          <span>{ratePlan.sellMode === 'per_room' ? 'Per Kamar' : 'Per Orang'}</span>
          <span>·</span>
          <span>Max {ratePlan.maxPersons} tamu</span>
          <span>·</span>
          <span>{ratePlan.isRefundable ? 'Refundable' : 'Non-Refundable'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-background p-1 w-fit">
        {([
          { key: 'calendar', label: 'Harga & Kalender', icon: CalendarDays },
          { key: 'restrictions', label: 'Restrictions', icon: Lock },
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

      {tab === 'calendar' && (
        <PriceCalendar
          ratePlanId={ratePlan.id}
          basePrice={ratePlan.basePrice}
          initialOverrides={initialOverrides}
          initialYear={initialYear}
          initialMonth={initialMonth}
        />
      )}

      {tab === 'restrictions' && (
        <RestrictionForm
          ratePlanId={ratePlan.id}
          initial={initialRestriction}
        />
      )}
    </div>
  )
}
