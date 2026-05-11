import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/getSession'

export async function GET() {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(
    { id: user.id, name: user.name, email: user.email ?? '', role: user.role, villaName: user.villa.name, villaId: user.villaId },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
  )
}
