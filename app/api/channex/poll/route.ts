import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ChannexClient } from '@/lib/channex/client'
import { processRevisionById } from '@/lib/channex/bookings'

// Protect endpoint with a shared secret to prevent public abuse
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // no secret configured → allow (set CRON_SECRET in prod)
  return req.headers.get('x-cron-secret') === secret
}

interface FeedItem {
  id: string
  type: string
  attributes: {
    id: string
    status: string
    property_id: string
  }
}

interface FeedResponse {
  data: FeedItem | null
}

// Drain the Feed API for one config: process revisions one by one until feed is empty.
// Channex Feed API guarantees FIFO order and only returns unacked revisions.
async function drainFeed(
  client: ChannexClient,
  villaId: string,
  propertyId: string
): Promise<number> {
  let processed = 0
  let attempts = 0
  const MAX = 200 // safety cap per poll run

  while (attempts < MAX) {
    attempts++
    const feed = await client.get<FeedResponse>('/booking_revisions/feed', {
      property_id: propertyId ?? '',
    })

    const revision = feed?.data ?? (feed as unknown as FeedItem | null)
    if (!revision || !revision.id) break

    try {
      await processRevisionById(revision.id, villaId, client)
      processed++
    } catch (e) {
      console.error(`[Channex poll] failed to process revision ${revision.id}:`, e)
      // Break on error to avoid infinite loop if ack failed
      break
    }
  }

  return processed
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const configs = await db.channexConfig.findMany({ where: { isActive: true } })
  if (configs.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  let totalProcessed = 0

  for (const config of configs) {
    try {
      const client = new ChannexClient(config.apiKey, config.environment as 'staging' | 'production')
      const count = await drainFeed(client, config.villaId, config.channexPropertyId ?? '')
      console.log(`[Channex poll] ${config.channexPropertyId}: processed ${count} revisions`)
      totalProcessed += count
    } catch (e) {
      console.error(`[Channex poll] error for property ${config.channexPropertyId}:`, e)
    }
  }

  return NextResponse.json({ ok: true, processed: totalProcessed })
}

// Also allow GET for easy cron-job.org setup (some services only do GET)
export async function GET(req: NextRequest) {
  return POST(req)
}
