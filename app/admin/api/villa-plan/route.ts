import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromBearer } from '@/lib/getSessionFromBearer'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromBearer(req.headers.get('authorization') ?? null)
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.villaId || !body?.plan) {
    return NextResponse.json({ error: 'villaId and plan are required' }, { status: 400 })
  }

  if (!['FREE', 'PRO'].includes(body.plan)) {
    return NextResponse.json({ error: 'plan must be FREE or PRO' }, { status: 400 })
  }

  const subscription = await db.subscription.upsert({
    where: { villaId: body.villaId },
    update: { plan: body.plan, updatedAt: new Date() },
    create: {
      villaId: body.villaId,
      plan: body.plan,
      status: 'ACTIVE',
    },
  })

  return NextResponse.json({ success: true, plan: subscription.plan })
}
