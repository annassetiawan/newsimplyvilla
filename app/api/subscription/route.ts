import { NextResponse } from 'next/server'
import { getVillaSubscription } from '@/lib/subscription'

const VILLA_ID = 'villa-senja-ubud'

export async function GET() {
  const sub = await getVillaSubscription(VILLA_ID)

  if (!sub) {
    return NextResponse.json({ plan: 'FREE', status: 'INACTIVE', startDate: null, endDate: null })
  }

  console.log('[subscription API] villa:', VILLA_ID, '| plan:', sub.plan, '| status:', sub.status)

  return NextResponse.json({
    plan: sub.plan,
    status: sub.status,
    startDate: sub.startDate.toISOString(),
    endDate: sub.endDate ? sub.endDate.toISOString() : null,
  })
}
