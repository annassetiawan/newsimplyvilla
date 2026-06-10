import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/getSession'

export async function GET() {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ plan: 'FREE', status: 'INACTIVE', startDate: null, endDate: null })
  }

  const sub = user.villa?.subscription

  if (!sub) {
    return NextResponse.json({ plan: 'FREE', status: 'INACTIVE', startDate: null, endDate: null })
  }

  return NextResponse.json(
    { plan: sub.plan, status: sub.status, startDate: new Date(sub.startDate).toISOString(), endDate: sub.endDate ? new Date(sub.endDate).toISOString() : null },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
  )
}
