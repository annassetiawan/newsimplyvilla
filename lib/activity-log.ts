import { db } from '@/lib/db'

export async function logActivity(data: {
  villaId: string
  staffName?: string | null
  action: string
  module: string
}) {
  try {
    await db.activityLog.create({
      data: {
        villaId: data.villaId,
        staffName: data.staffName ?? null,
        action: data.action,
        module: data.module,
      },
    })
  } catch {
    // fire-and-forget — never fail the main action
  }
}
