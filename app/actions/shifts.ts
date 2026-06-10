'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { logActivity } from '@/lib/activity-log'

export async function upsertShift(data: {
  staffId: string
  date: Date
  shiftType: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'OFF'
}) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
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

    const staffMember = await db.staff.findUnique({ where: { id: data.staffId } })
    if (staffMember) {
      await logActivity({
        villaId: user.villaId!,
        staffName: user.name,
        action: `Assigned shift: ${data.shiftType} – ${staffMember.name}`,
        module: 'Schedule',
      })
    }

    revalidatePath('/schedule')

    return {
      success: true,
      data: {
        id: shift.id,
        staffId: shift.staffId,
        date: shift.date.toISOString(),
        shiftType: shift.shiftType,
      },
    }
  } catch (error) {
    console.error('upsertShift error:', error)
    return { success: false, message: 'Gagal menyimpan jadwal. Coba lagi.' }
  }
}
