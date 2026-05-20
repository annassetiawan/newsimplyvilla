'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'

function diffBusinessDays(start: Date, end: Date): number {
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return Math.max(1, count)
}

const LeaveSchema = z.object({
  employeeId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(1),
})

export async function createLeaveRequest(data: z.infer<typeof LeaveSchema>) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const parsed = LeaveSchema.parse(data)
  const start = new Date(parsed.startDate)
  const end = new Date(parsed.endDate)
  const totalDays = diffBusinessDays(start, end)

  const allocation = await db.leaveAllocation.findUnique({
    where: {
      employeeId_year: {
        employeeId: parsed.employeeId,
        year: start.getFullYear(),
      },
    },
  })

  if (allocation) {
    const remaining = allocation.totalDays - allocation.usedDays
    if (totalDays > remaining) {
      return { error: `Sisa jatah cuti tidak cukup. Tersisa ${remaining} hari.` }
    }
  }

  await db.leaveRequest.create({
    data: {
      employeeId: parsed.employeeId,
      startDate: start,
      endDate: end,
      totalDays,
      reason: parsed.reason,
      villaId: user.villaId,
    },
  })

  revalidatePath('/employee')
  return { success: true }
}

export async function approveLeave(id: string) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const leave = await db.leaveRequest.findUnique({ where: { id } })
  if (!leave) return { error: 'Pengajuan tidak ditemukan' }

  await db.$transaction([
    db.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED', reviewedBy: user.name },
    }),
    db.leaveAllocation.updateMany({
      where: {
        employeeId: leave.employeeId,
        year: leave.startDate.getFullYear(),
        villaId: user.villaId,
      },
      data: { usedDays: { increment: leave.totalDays } },
    }),
  ])

  revalidatePath('/employee')
  return { success: true }
}

export async function rejectLeave(id: string, reviewNote: string) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  await db.leaveRequest.update({
    where: { id, villaId: user.villaId },
    data: {
      status: 'REJECTED',
      reviewedBy: user.name,
      reviewNote,
    },
  })

  revalidatePath('/employee')
  return { success: true }
}

export async function updateLeaveAllocation(
  employeeId: string,
  year: number,
  totalDays: number
) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  await db.leaveAllocation.upsert({
    where: { employeeId_year: { employeeId, year } },
    create: { employeeId, year, totalDays, usedDays: 0, villaId: user.villaId },
    update: { totalDays },
  })

  revalidatePath('/employee')
  return { success: true }
}
