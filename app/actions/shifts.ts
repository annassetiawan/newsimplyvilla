'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function upsertShift(data: {
  staffId: string
  date: Date
  shiftType: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'OFF'
}) {
  const dayStart = new Date(data.date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(data.date)
  dayEnd.setHours(23, 59, 59, 999)

  const existing = await db.shift.findFirst({
    where: {
      staffId: data.staffId,
      date: { gte: dayStart, lte: dayEnd },
    },
  })

  let shift: { id: string; staffId: string; date: Date; shiftType: string }

  if (existing) {
    shift = await db.shift.update({ where: { id: existing.id }, data: { shiftType: data.shiftType } })
  } else {
    shift = await db.shift.create({ data: { staffId: data.staffId, date: data.date, shiftType: data.shiftType } })
  }

  revalidatePath('/schedule')

  return {
    id: shift.id,
    staffId: shift.staffId,
    date: shift.date.toISOString(),
    shiftType: shift.shiftType,
  }
}
