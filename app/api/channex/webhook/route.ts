import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ChannexClient } from '@/lib/channex/client'
import { processRevisionById } from '@/lib/channex/bookings'

function secretsMatch(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Log full payload to debug Channex webhook format
    console.log('[Channex webhook] payload:', JSON.stringify(body))

    // Channex actual format: { event, timestamp, property_id, payload: { booking_revision_id, property_id, ... } }
    const revisionId: string | undefined =
      body?.payload?.booking_revision_id ??
      body?.payload?.revision_id ??
      body?.revision_id

    const channexPropertyId: string | undefined =
      body?.property_id ??
      body?.payload?.property_id

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

    // Verify shared secret if one was registered. If no secret is configured
    // (e.g. webhook registered manually without a header), allow through with a warning.
    const incomingSecret = req.headers.get('x-channex-webhook-secret')
    if (config.webhookSecret && incomingSecret) {
      if (!secretsMatch(incomingSecret, config.webhookSecret)) {
        console.warn('[Channex webhook] rejected: invalid secret header')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else if (config.webhookSecret && !incomingSecret) {
      console.warn('[Channex webhook] no secret header — allowed (manually registered webhook)')
    }

    const client = new ChannexClient(config.apiKey, config.environment as 'staging' | 'production')
    await processRevisionById(revisionId, config.villaId, client)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[Channex webhook]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
