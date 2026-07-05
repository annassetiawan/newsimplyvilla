import { db } from '@/lib/db'
import { getChannexClient } from './getClient'
import { getMapping } from './mapping'

// IDR has no cents; Channex expects minor units (×100)
function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Run-length encode consecutive dates with equal values into {date_from, date_to} ranges
function compressRanges<T extends Record<string, unknown>>(
  entries: Array<{ date: string } & T>
): Array<{ date_from: string; date_to: string } & Omit<T, 'date'>> {
  if (entries.length === 0) return []

  const result: Array<{ date_from: string; date_to: string } & Omit<T, 'date'>> = []
  let rangeStart = entries[0]

  for (let i = 1; i <= entries.length; i++) {
    const cur = entries[i]
    const prev = entries[i - 1]
    const prevValues = { ...prev } as Record<string, unknown>
    delete prevValues.date

    const sameValues =
      cur &&
      (() => {
        const curValues = { ...cur } as Record<string, unknown>
        delete curValues.date
        return JSON.stringify(prevValues) === JSON.stringify(curValues)
      })()

    const consecutive =
      cur &&
      (() => {
        const prevD = new Date(prev.date)
        const curD = new Date(cur.date)
        prevD.setDate(prevD.getDate() + 1)
        return toISO(prevD) === cur.date
      })()

    if (!sameValues || !consecutive) {
      const { date: _d, ...rest } = rangeStart as { date: string } & T
      result.push({ date_from: rangeStart.date, date_to: prev.date, ...rest } as unknown as { date_from: string; date_to: string } & Omit<T, 'date'>)
      if (cur) rangeStart = cur
    }
  }

  return result
}

// ── Availability push ────────────────────────────────────────────────────────

export async function pushAvailability(
  villaId: string,
  roomId: string,
  dateFrom: string,
  dateTo: string
): Promise<void> {
  const client = await getChannexClient(villaId)
  if (!client) return

  const [channexPropertyId, channexRoomTypeId] = await Promise.all([
    getMapping(villaId, 'property', villaId),
    getMapping(villaId, 'room_type', roomId),
  ])
  if (!channexPropertyId || !channexRoomTypeId) return

  const today = toISO(new Date())
  const from = dateFrom < today ? today : dateFrom

  // Generate all dates in range
  const dates: string[] = []
  const cur = new Date(from)
  const end = new Date(dateTo)
  while (cur <= end) {
    dates.push(toISO(cur))
    cur.setDate(cur.getDate() + 1)
  }
  if (dates.length === 0) return

  // For each date: count_of_rooms(1) minus active reservations that overlap
  const occupiedCounts = await Promise.all(
    dates.map((date) =>
      db.reservation.count({
        where: {
          roomId,
          status: { in: ['CONFIRMED', 'CHECKEDIN', 'PENDING'] },
          checkIn: { lte: new Date(date) },
          checkOut: { gt: new Date(date) },
        },
      })
    )
  )
  const entries: Array<{ date: string; availability: number }> = dates.map((date, i) => ({
    date,
    availability: Math.max(0, 1 - occupiedCounts[i]),
  }))

  const compressed = compressRanges(entries)
  const values = compressed.map((e) => ({
    property_id: channexPropertyId,
    room_type_id: channexRoomTypeId,
    date_from: e.date_from,
    date_to: e.date_to,
    availability: e.availability,
  }))

  await client.post('/availability', { values })
}

// ── Rates & Restrictions push ────────────────────────────────────────────────

export async function pushRatesAndRestrictions(
  villaId: string,
  ratePlanId: string,
  dates: string[]
): Promise<void> {
  const client = await getChannexClient(villaId)
  if (!client) return

  const [channexPropertyId, channexRatePlanId] = await Promise.all([
    getMapping(villaId, 'property', villaId),
    getMapping(villaId, 'rate_plan', ratePlanId),
  ])
  if (!channexPropertyId || !channexRatePlanId) return

  const today = toISO(new Date())
  const futureDates = dates.filter((d) => d >= today)
  if (futureDates.length === 0) return

  const [rp, restriction, overrides] = await Promise.all([
    db.ratePlan.findUniqueOrThrow({ where: { id: ratePlanId } }),
    db.ratePlanRestriction.findUnique({ where: { ratePlanId } }),
    db.priceOverride.findMany({
      where: { ratePlanId, date: { in: futureDates.map((d) => new Date(d)) } },
    }),
  ])

  const overrideMap = new Map(overrides.map((o) => [toISO(new Date(o.date)), o]))
  const basePrice = Number(rp.basePrice)

  type Entry = {
    date: string
    rate: number
    stop_sell: boolean
    min_stay_arrival: number
    closed_to_arrival: boolean
    closed_to_departure: boolean
  }

  const entries: Entry[] = futureDates.map((date) => {
    const override = overrideMap.get(date)
    const isClosed = override?.isClosed ?? false
    const rate = isClosed
      ? toMinorUnits(basePrice)
      : override?.price !== null && override?.price !== undefined
      ? toMinorUnits(Number(override.price))
      : toMinorUnits(basePrice)

    return {
      date,
      rate,
      stop_sell: isClosed,
      min_stay_arrival: restriction?.minStay ?? 1,
      closed_to_arrival: isClosed || (restriction?.closedToArrival ?? false),
      closed_to_departure: isClosed || (restriction?.closedToDeparture ?? false),
    }
  })

  const compressed = compressRanges(entries)
  const values = compressed.map((e) => ({
    property_id: channexPropertyId,
    rate_plan_id: channexRatePlanId,
    date_from: e.date_from,
    date_to: e.date_to,
    rate: e.rate,
    stop_sell: e.stop_sell,
    min_stay_arrival: e.min_stay_arrival,
    closed_to_arrival: e.closed_to_arrival,
    closed_to_departure: e.closed_to_departure,
  }))

  await client.post('/restrictions', { values })
}

// Push rates for next N days (used after restriction changes)
export async function pushRatesForDays(
  villaId: string,
  ratePlanId: string,
  days = 365
): Promise<void> {
  const today = new Date()
  const dates: string[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    dates.push(toISO(d))
  }
  await pushRatesAndRestrictions(villaId, ratePlanId, dates)
}
