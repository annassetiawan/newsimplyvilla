import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ChannexClient } from '@/lib/channex/client'
import { processRevisionById } from '@/lib/channex/bookings'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Log full payload to debug Channex webhook format
    console.log('[Channex webhook] payload:', JSON.stringify(body))

    // Channex may send: { payload: { revision_id, property_id } }
    // or: { revision_id, property_id }
    // or: { event, payload: { booking_revision: { id, property_id } } }
    const revisionId: string | undefined =
      body?.payload?.revision_id ??
      body?.payload?.booking_revision?.id ??
      body?.revision_id ??
      body?.id

    const channexPropertyId: string | undefined =
      body?.payload?.property_id ??
      body?.payload?.booking_revision?.property_id ??
      body?.property_id

    if (!revisionId || !channexPropertyId) {
      // Return 200 to prevent Channex retry flood; log for debugging
      console.warn('[Channex webhook] unrecognised payload shape, acking silently')
      return NextResponse.json({ ok: true, skipped: 'unrecognised_payload' })
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
