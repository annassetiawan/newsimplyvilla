import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'

export async function GET() {
  const user = await getSessionUser()
  if (!user?.villaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await db.notification.findMany({
    where: { villaId: user.villaId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user?.villaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json().catch(() => ({}))

  if (id) {
    await db.notification.updateMany({
      where: { id, villaId: user.villaId },
      data: { isRead: true },
    })
  } else {
    // mark all as read
    await db.notification.updateMany({
      where: { villaId: user.villaId, isRead: false },
      data: { isRead: true },
    })
  }

  return NextResponse.json({ ok: true })
}
