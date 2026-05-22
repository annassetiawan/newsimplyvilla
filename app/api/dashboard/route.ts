import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromBearer } from '@/lib/getSessionFromBearer'
import { getDateRange } from '@/lib/dashboard-date'

export async function GET(req: NextRequest) {
  const staff = await getSessionFromBearer(req.headers.get('authorization'))
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const preset = searchParams.get('preset') ?? 'this_month'

  const villaId = staff.villaId
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  const { from: rangeFrom, to: rangeTo, prevFrom, prevTo } = getDateRange(preset)

  const [rooms, openTasks, recentReservations, allInventory, monthlyIncome, chartReservations, thisMonthCount, lastMonthCount] =
    await Promise.all([
      db.room.findMany({ where: { villaId }, orderBy: { code: 'asc' } }),
      db.task.findMany({
        where: { villaId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      db.reservation.findMany({
        where: { room: { villaId }, status: { notIn: ['CANCELLED'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { guest: true, room: true },
      }),
      db.inventoryItem.findMany({
        where: { villaId },
        select: { id: true, name: true, onHand: true, minLevel: true },
      }),
      db.transaction.findMany({
        where: { villaId, type: 'INCOME', date: { gte: twelveMonthsAgo } },
        select: { amount: true, date: true },
      }),
      db.reservation.findMany({
        where: {
          room: { villaId },
          status: { notIn: ['CANCELLED'] },
          checkOut: { gte: twelveMonthsAgo },
        },
        select: { checkIn: true, checkOut: true, createdAt: true },
        take: 1000,
      }),
      db.reservation.count({
        where: {
          room: { villaId },
          status: { notIn: ['CANCELLED'] },
          createdAt: { gte: rangeFrom, lte: rangeTo },
        },
      }),
      db.reservation.count({
        where: {
          room: { villaId },
          status: { notIn: ['CANCELLED'] },
          createdAt: { gte: prevFrom, lte: prevTo },
        },
      }),
    ])

  // KPI calculations
  const lowStock = allInventory.filter((i) => i.onHand < i.minLevel)
  const occupiedCount = rooms.filter((r) => r.status === 'OCCUPIED' || r.status === 'CLEANING').length
  const occupancyPct = rooms.length ? Math.round((occupiedCount / rooms.length) * 100) : 0
  const highPriorityCount = openTasks.filter((t) => t.priority === 'HIGH').length
  const totalRevenue = monthlyIncome
    .filter((tx) => tx.date >= rangeFrom && tx.date <= rangeTo)
    .reduce((s, t) => s + t.amount, 0)
  const lastMonthRevenue = monthlyIncome
    .filter((tx) => tx.date >= prevFrom && tx.date <= prevTo)
    .reduce((s, t) => s + t.amount, 0)

  function calcPct(current: number, previous: number): number | null {
    if (previous === 0) return null
    return Math.round(((current - previous) / previous) * 100)
  }

  // Chart data (12 months)
  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
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
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const totalRoomNights = rooms.length * daysInMonth
    const occupiedNights = occupancyMap.get(key) ?? 0
    const occupancy = totalRoomNights > 0 ? Math.round((occupiedNights / totalRoomNights) * 100) : 0
    return {
      month: MONTH_LABELS[d.getMonth()],
      revenue: revenueMap.get(key) ?? 0,
      bookings: bookingsMap.get(key) ?? 0,
      occupancy,
    }
  })

  return NextResponse.json({
    kpi: {
      totalRevenue,
      revenuePct: calcPct(totalRevenue, lastMonthRevenue),
      occupancyPct,
      occupiedCount,
      totalRooms: rooms.length,
      reservationCount: thisMonthCount,
      reservationPct: calcPct(thisMonthCount, lastMonthCount),
      openTaskCount: openTasks.length,
      highPriorityCount,
    },
    rooms: rooms.map((r) => ({ id: r.id, code: r.code, status: r.status })),
    tasks: openTasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      assignedTo: t.assignedTo,
      dueDate: t.dueDate?.toISOString() ?? null,
    })),
    recentReservations: recentReservations.map((r) => ({
      id: r.id,
      guestName: r.guest.name,
      roomCode: r.room.code,
      checkIn: r.checkIn.toISOString(),
      checkOut: r.checkOut.toISOString(),
      totalAmount: r.totalAmount,
      paymentStatus: r.paymentStatus,
    })),
    lowStock: lowStock.map((i) => ({
      id: i.id,
      name: i.name,
      onHand: i.onHand,
      minLevel: i.minLevel,
    })),
    chart: {
      data: chartData,
      totalBookings: chartData.reduce((s, d) => s + d.bookings, 0),
      avgOccupancy: Math.round(chartData.reduce((s, d) => s + d.occupancy, 0) / 12),
    },
  })
}
