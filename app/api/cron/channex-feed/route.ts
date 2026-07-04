import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ChannexClient } from '@/lib/channex/client'
import { processRevisionById } from '@/lib/channex/bookings'

const CRON_SECRET = process.env.CRON_SECRET

interface FeedRevision {
  id: string
  status: string
  booking?: { property_id?: string }
}

interface FeedResponse {
  data: FeedRevision[]
  meta: { total: number; limit: number }
}

export async function GET(req: NextRequest) {
  // Protect the endpoint
  const auth = req.headers.get('authorization')
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Load all active Channex configs
  const configs = await db.channexConfig.findMany({ where: { isActive: true } })
  if (configs.length === 0) return NextResponse.json({ ok: true, processed: 0 })

  // Build a map from channexPropertyId → villaId for fast lookup
  const propertyMap = new Map<string, { villaId: string; client: ChannexClient }>()
  for (const cfg of configs) {
    if (cfg.channexPropertyId) {
      propertyMap.set(cfg.channexPropertyId, {
        villaId: cfg.villaId,
        client: new ChannexClient(cfg.apiKey, cfg.environment as 'staging' | 'production'),
      })
    }
  }

  // Use the first config's client to poll the account-wide feed
  const firstCfg = configs[0]
  const feedClient = new ChannexClient(firstCfg.apiKey, firstCfg.environment as 'staging' | 'production')

  let processed = 0
  let hasMore = true

  // Drain until empty
  while (hasMore) {
    const feed = await feedClient.get<FeedResponse>('/booking_revisions/feed', { limit: '10' })
    const revisions: FeedRevision[] = Array.isArray(feed) ? feed : (feed as FeedResponse).data ?? []
    const meta = (feed as FeedResponse).meta

    if (revisions.length === 0) break

    for (const rev of revisions) {
      const propId = rev.booking?.property_id
      const entry = propId ? propertyMap.get(propId) : undefined

      if (!entry) {
        // Unknown property — ack and skip to avoid wedging the feed
        try {
          await feedClient.post(`/booking_revisions/${rev.id}/ack`, {})
        } catch {}
        continue
      }

      try {
        await processRevisionById(rev.id, entry.villaId, entry.client)
        processed++
      } catch (e) {
        console.error(`[Channex feed] Failed to process revision ${rev.id}:`, e)
        // Don't ack — leave for retry within the 30-min window
      }
    }

    hasMore = meta ? meta.total > meta.limit : false
  }

  return NextResponse.json({ ok: true, processed })
}
