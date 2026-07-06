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

interface RevisionListItem {
  id: string
  type: string
  attributes: {
    id: string
    status: string
  }
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

      // Fetch unacked booking revisions for this property
      const revisions = await client.get<RevisionListItem[]>('/booking_revisions', {
        property_id: config.channexPropertyId,
        'filter[status]': 'new,modified,cancelled',
        'filter[is_acked]': 'false',
        per_page: '50',
      })

      const list = Array.isArray(revisions) ? revisions : []
      console.log(`[Channex poll] ${config.channexPropertyId}: ${list.length} unacked revisions`)

      for (const rev of list) {
        try {
          await processRevisionById(rev.id, config.villaId, client)
          totalProcessed++
        } catch (e) {
          console.error(`[Channex poll] failed to process revision ${rev.id}:`, e)
        }
      }
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
