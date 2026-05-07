import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/getSession'

export async function GET() {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ plan: 'FREE', status: 'INACTIVE', startDate: null, endDate: null })
  }

  const sub = user.villa.subscription

  if (!sub) {
    return NextResponse.json({ plan: 'FREE', status: 'INACTIVE', startDate: null, endDate: null })
  }

  return NextResponse.json({
    plan: sub.plan,
    status: sub.status,
    startDate: sub.startDate.toISOString(),
    endDate: sub.endDate ? sub.endDate.toISOString() : null,
  })
}
