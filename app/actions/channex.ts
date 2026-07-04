'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { ChannexClient } from '@/lib/channex/client'
import { initialSync } from '@/lib/channex/sync'
import { pushRatesForDays, pushAvailability } from '@/lib/channex/ari'

async function getVillaId() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  return user.villaId!
}

export async function saveChannexConfig(input: {
  apiKey: string
  environment: 'staging' | 'production'
}) {
  const villaId = await getVillaId()

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
  const villaId = await getVillaId()

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
  const villaId = await getVillaId()

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
  const villaId = await getVillaId()

  const config = await db.channexConfig.findUnique({ where: { villaId } })
  if (!config?.isActive) return { success: false, message: 'Channex belum terhubung' }

  const client = new ChannexClient(config.apiKey, config.environment as 'staging' | 'production')
  const callbackUrl = `${appUrl}/api/channex/webhook`

  try {
    type WebhookRes = { id: string }
    const data = await client.post<WebhookRes>('/webhooks', {
      webhook: {
        callback_url: callbackUrl,
        event_mask: 'booking_new;booking_modification;booking_cancellation',
        property_id: config.channexPropertyId ?? null,
        is_active: true,
        send_data: true,
      },
    })
    const webhookId = (data as unknown as { id: string }).id
    await db.channexConfig.update({ where: { villaId }, data: { webhookId } })
    revalidatePath('/channel-manager')
    return { success: true, webhookId }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, message: msg }
  }
}

export async function pushAllAvailabilityNow() {
  const villaId = await getVillaId()

  const config = await db.channexConfig.findUnique({ where: { villaId } })
  if (!config?.isActive) return { success: false, message: 'Channex belum terhubung' }

  const rooms = await db.room.findMany({ where: { villaId } })
  if (rooms.length === 0) return { success: false, message: 'Tidak ada room' }

  const today = new Date().toISOString().split('T')[0]
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 365)
  const dateTo = endDate.toISOString().split('T')[0]

  const results: Array<{ name: string; ok: boolean; error?: string }> = []
  for (const room of rooms) {
    try {
      await pushAvailability(villaId, room.id, today, dateTo)
      results.push({ name: room.name, ok: true })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      results.push({ name: room.name, ok: false, error: msg })
    }
  }

  const failed = results.filter((r) => !r.ok)
  return {
    success: failed.length === 0,
    results,
    message: failed.length > 0
      ? `Gagal: ${failed.map((r) => `${r.name}: ${r.error}`).join('; ')}`
      : `Availability ${results.length} room berhasil di-push`,
  }
}

export async function pushAllRatesNow() {
  const villaId = await getVillaId()

  const config = await db.channexConfig.findUnique({ where: { villaId } })
  if (!config?.isActive) return { success: false, message: 'Channex belum terhubung' }

  const ratePlans = await db.ratePlan.findMany({ where: { villaId, isActive: true } })
  if (ratePlans.length === 0) return { success: false, message: 'Tidak ada rate plan aktif' }

  const results: Array<{ name: string; ok: boolean; error?: string }> = []

  for (const rp of ratePlans) {
    try {
      await pushRatesForDays(villaId, rp.id, 365)
      results.push({ name: rp.name, ok: true })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      results.push({ name: rp.name, ok: false, error: msg })
    }
  }

  const failed = results.filter((r) => !r.ok)
  return {
    success: failed.length === 0,
    results,
    message: failed.length > 0
      ? `${failed.length} rate plan gagal: ${failed.map((r) => `${r.name}: ${r.error}`).join('; ')}`
      : `${results.length} rate plan berhasil di-push`,
  }
}

export async function getOtaStats() {
  const villaId = await getVillaId()

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

export async function deactivateChannex() {
  const villaId = await getVillaId()
  await db.channexConfig.update({ where: { villaId }, data: { isActive: false } })
  revalidatePath('/channel-manager')
  return { success: true }
}
