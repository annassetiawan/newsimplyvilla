'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { ChannexClient } from '@/lib/channex/client'
import { initialSync } from '@/lib/channex/sync'
import { pushBatchRatesForPlans, pushAllAvailabilityBatch, pushAvailability } from '@/lib/channex/ari'

async function getSessionVillaId() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  return user.villaId!
}

export async function saveChannexConfig(input: {
  apiKey: string
  environment: 'staging' | 'production'
}) {
  const villaId = await getSessionVillaId()

  // Test the connection before saving
  const client = new ChannexClient(input.apiKey, input.environment)
  try {
    await client.get('/properties')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, message: `Koneksi gagal: ${msg}` }
  }

  await db.channexConfig.upsert({
    where: { villaId },
    create: {
      villaId,
      apiKey: input.apiKey,
      environment: input.environment,
      isActive: true,
    },
    update: {
      apiKey: input.apiKey,
      environment: input.environment,
      isActive: true,
    },
  })

  revalidatePath('/settings/channex')
  return { success: true }
}

export async function runInitialSync() {
  const villaId = await getSessionVillaId()

  try {
    const result = await initialSync(villaId)
    revalidatePath('/settings/channex')
    return { success: true, data: result }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, message: msg }
  }
}

export async function getChannexStatus() {
  const villaId = await getSessionVillaId()

  const config = await db.channexConfig.findUnique({ where: { villaId } })
  if (!config) return { connected: false }

  const [syncedRooms, syncedRatePlans] = await Promise.all([
    db.channexMapping.count({ where: { villaId, kind: 'room_type' } }),
    db.channexMapping.count({ where: { villaId, kind: 'rate_plan' } }),
  ])

  return {
    connected: true,
    isActive: config.isActive,
    environment: config.environment as 'staging' | 'production',
    channexPropertyId: config.channexPropertyId,
    webhookId: config.webhookId,
    lastSyncAt: config.lastSyncAt?.toISOString() ?? null,
    syncedRooms,
    syncedRatePlans,
  }
}

export async function registerWebhook(appUrl: string) {
  const villaId = await getSessionVillaId()

  const config = await db.channexConfig.findUnique({ where: { villaId } })
  if (!config?.isActive) return { success: false, message: 'Channex belum terhubung' }

  const client = new ChannexClient(config.apiKey, config.environment as 'staging' | 'production')
  const callbackUrl = `${appUrl}/api/channex/webhook`
  const webhookSecret = randomBytes(32).toString('hex')

  try {
    type WebhookRes = { id: string }
    const data = await client.post<WebhookRes>('/webhooks', {
      webhook: {
        callback_url: callbackUrl,
        event_mask: 'booking_new;booking_modification;booking_cancellation',
        property_id: config.channexPropertyId ?? null,
        is_active: true,
        send_data: true,
        headers: { 'X-Channex-Webhook-Secret': webhookSecret },
      },
    })
    const webhookId = (data as unknown as { id: string }).id
    await db.channexConfig.update({ where: { villaId }, data: { webhookId, webhookSecret } })
    revalidatePath('/channel-manager')
    return { success: true, webhookId }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, message: msg }
  }
}

export async function pushAllAvailabilityNow() {
  const villaId = await getSessionVillaId()

  const config = await db.channexConfig.findUnique({ where: { villaId } })
  if (!config?.isActive) return { success: false, message: 'Channex belum terhubung' }

  try {
    await pushAllAvailabilityBatch(villaId, 500)
    return { success: true, message: 'Availability semua room berhasil di-push (500 hari)' }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, message: msg }
  }
}

export async function pushAllRatesNow() {
  const villaId = await getSessionVillaId()

  const config = await db.channexConfig.findUnique({ where: { villaId } })
  if (!config?.isActive) return { success: false, message: 'Channex belum terhubung' }

  const ratePlans = await db.ratePlan.findMany({ where: { villaId, isActive: true } })
  if (ratePlans.length === 0) return { success: false, message: 'Tidak ada rate plan aktif' }

  try {
    await pushBatchRatesForPlans(villaId, ratePlans.map((rp) => rp.id), 500)
    return { success: true, message: `${ratePlans.length} rate plan berhasil di-push (500 hari)` }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, message: msg }
  }
}

export async function getOtaStats() {
  const villaId = await getSessionVillaId()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [bookingsThisMonth, syncedRooms, activeRatePlans] = await Promise.all([
    db.reservation.count({
      where: { room: { villaId }, channexBookingId: { not: null }, createdAt: { gte: startOfMonth } },
    }),
    db.channexMapping.count({ where: { villaId, kind: 'room_type' } }),
    db.ratePlan.count({ where: { villaId, isActive: true } }),
  ])

  return { bookingsThisMonth, syncedRooms, activeRatePlans }
}

export async function getRatePlansForVilla() {
  const villaId = await getSessionVillaId()
  const rooms = await db.room.findMany({
    where: { villaId },
    include: { ratePlans: { where: { isActive: true } } },
  })
  return rooms.flatMap((room) =>
    room.ratePlans.map((rp) => ({
      id: rp.id,
      name: rp.name,
      roomName: room.name,
      basePrice: Number(rp.basePrice),
    }))
  )
}

export async function pushAriDeltaForDateRange(input: {
  ratePlanId: string
  dateFrom: string
  dateTo: string
  price?: number | null
  minStay?: number | null
  maxStay?: number | null
  stopSell?: boolean
  closedToArrival?: boolean
  closedToDeparture?: boolean
}) {
  const villaId = await getSessionVillaId()

  const config = await db.channexConfig.findUnique({ where: { villaId } })
  if (!config?.isActive) return { success: false, message: 'Channex belum terhubung' }

  // Generate all dates in range
  const dates: string[] = []
  const cur = new Date(input.dateFrom)
  const end = new Date(input.dateTo)
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  if (dates.length === 0) return { success: false, message: 'Rentang tanggal tidak valid' }
  if (dates.length > 365) return { success: false, message: 'Rentang maksimal 365 hari' }

  // Upsert PriceOverride for each date
  await Promise.all(
    dates.map((dateStr) =>
      db.priceOverride.upsert({
        where: { ratePlanId_date: { ratePlanId: input.ratePlanId, date: new Date(dateStr) } },
        create: {
          ratePlanId: input.ratePlanId,
          villaId,
          date: new Date(dateStr),
          price: input.price ?? null,
          isClosed: input.stopSell ?? false,
          minStay: input.minStay ?? null,
          maxStay: input.maxStay ?? null,
          closedToArrival: input.closedToArrival ?? null,
          closedToDeparture: input.closedToDeparture ?? null,
        },
        update: {
          ...(input.price !== undefined && { price: input.price }),
          ...(input.stopSell !== undefined && { isClosed: input.stopSell }),
          ...(input.minStay !== undefined && { minStay: input.minStay }),
          ...(input.maxStay !== undefined && { maxStay: input.maxStay }),
          ...(input.closedToArrival !== undefined && { closedToArrival: input.closedToArrival }),
          ...(input.closedToDeparture !== undefined && { closedToDeparture: input.closedToDeparture }),
        },
      })
    )
  )

  // Push delta to Channex for just these dates
  const { pushRatesAndRestrictions } = await import('@/lib/channex/ari')
  try {
    await pushRatesAndRestrictions(villaId, input.ratePlanId, dates)
    return { success: true, message: `${dates.length} hari berhasil di-push ke Channex` }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, message: msg }
  }
}

export async function deactivateChannex() {
  const villaId = await getSessionVillaId()
  await db.channexConfig.update({ where: { villaId }, data: { isActive: false } })
  revalidatePath('/channel-manager')
  return { success: true }
}

export async function getSyncDetails() {
  const villaId = await getSessionVillaId()

  const [rooms, ratePlans, mappings] = await Promise.all([
    db.room.findMany({ where: { villaId }, orderBy: { code: 'asc' } }),
    db.ratePlan.findMany({
      where: { villaId },
      include: { room: { select: { name: true } } },
      orderBy: [{ room: { code: 'asc' } }, { createdAt: 'asc' }],
    }),
    db.channexMapping.findMany({
      where: { villaId, kind: { in: ['room_type', 'rate_plan'] } },
    }),
  ])

  const byKey = new Map(mappings.map((m) => [`${m.kind}:${m.localId}`, m.channexId]))

  return {
    rooms: rooms.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      channexId: byKey.get(`room_type:${r.id}`) ?? null,
    })),
    ratePlans: ratePlans.map((rp) => ({
      id: rp.id,
      name: rp.name,
      roomName: rp.room.name,
      isActive: rp.isActive,
      channexId: byKey.get(`rate_plan:${rp.id}`) ?? null,
    })),
  }
}
