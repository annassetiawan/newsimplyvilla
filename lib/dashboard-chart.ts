const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface DashboardChartPoint {
  month: string
  revenue: number
  bookings: number
  occupancy: number
}

interface IncomeTx {
  amount: number
  date: Date
}

interface ChartReservation {
  checkIn: Date
  checkOut: Date
  createdAt: Date
}

// Builds the 12-month revenue/bookings/occupancy series ending at `now`,
// in a single O(n) pass over transactions and reservations.
export function buildDashboardChartData(
  monthlyIncome: IncomeTx[],
  chartReservations: ChartReservation[],
  roomCount: number,
  now: Date
): DashboardChartPoint[] {
  const revenueMap = new Map<string, number>()
  for (const tx of monthlyIncome) {
    const key = `${tx.date.getFullYear()}-${tx.date.getMonth()}`
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + tx.amount)
  }

  const bookingsMap = new Map<string, number>()
  const occupancyMap = new Map<string, number>()
  for (const r of chartReservations) {
    const created = r.createdAt
    const bKey = `${created.getFullYear()}-${created.getMonth()}`
    bookingsMap.set(bKey, (bookingsMap.get(bKey) ?? 0) + 1)

    // Walk each month this reservation overlaps and accumulate occupied nights
    const ci = r.checkIn
    const co = r.checkOut
    let cursor = new Date(ci.getFullYear(), ci.getMonth(), 1)
    while (cursor <= co) {
      const mStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
      const mEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999)
      const overlapStart = Math.max(ci.getTime(), mStart.getTime())
      const overlapEnd = Math.min(co.getTime(), mEnd.getTime())
      if (overlapEnd > overlapStart) {
        const nights = Math.ceil((overlapEnd - overlapStart) / 86400000)
        const key = `${cursor.getFullYear()}-${cursor.getMonth()}`
        occupancyMap.set(key, (occupancyMap.get(key) ?? 0) + nights)
      }
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    }
  }

  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const totalRoomNights = roomCount * daysInMonth
    const occupiedNights = occupancyMap.get(key) ?? 0
    const occupancy = totalRoomNights > 0 ? Math.round((occupiedNights / totalRoomNights) * 100) : 0

    return {
      month: MONTH_LABELS[d.getMonth()],
      revenue: revenueMap.get(key) ?? 0,
      bookings: bookingsMap.get(key) ?? 0,
      occupancy,
    }
  })
}
