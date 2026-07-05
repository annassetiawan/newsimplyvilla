'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'

const BulkEntrySchema = z.object({
  employeeId: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'SICK', 'LEAVE', 'OFF']),
  note: z.string().optional(),
})

export async function bulkUpsertAttendance(
  entries: z.infer<typeof BulkEntrySchema>[],
  date: string
) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  const parsedDate = new Date(date)

  await Promise.all(
    entries.map((entry) =>
      db.attendance.upsert({
        where: {
          employeeId_date: { employeeId: entry.employeeId, date: parsedDate },
        },
        create: {
          employeeId: entry.employeeId,
          date: parsedDate,
          status: entry.status,
          note: entry.note || null,
          villaId: user.villaId!,
        },
        update: {
          status: entry.status,
          note: entry.note || null,
        },
      })
    )
  )

  revalidatePath('/employee')
  return { success: true }
}
