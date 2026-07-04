import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ChannexClient } from '@/lib/channex/client'
import { processRevisionById } from '@/lib/channex/bookings'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const revisionId: string | undefined =
      body?.payload?.revision_id ?? body?.revision_id

    const channexPropertyId: string | undefined =
      body?.payload?.property_id ?? body?.property_id

    if (!revisionId || !channexPropertyId) {
      return NextResponse.json({ error: 'Missing revision_id or property_id' }, { status: 400 })
    }

    // Find which villa owns this Channex property
    const config = await db.channexConfig.findFirst({
      where: { channexPropertyId, isActive: true },
    })
    if (!config) {
      // Unknown property — ack silently so Channex stops retrying
      return NextResponse.json({ ok: true, skipped: true })
    }

    const client = new ChannexClient(config.apiKey, config.environment as 'staging' | 'production')
    await processRevisionById(revisionId, config.villaId, client)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[Channex webhook]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
