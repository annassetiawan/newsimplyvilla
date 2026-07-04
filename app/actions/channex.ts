'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { ChannexClient } from '@/lib/channex/client'
import { initialSync } from '@/lib/channex/sync'

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

export async function deactivateChannex() {
  const villaId = await getVillaId()
  await db.channexConfig.update({ where: { villaId }, data: { isActive: false } })
  revalidatePath('/channel-manager')
  return { success: true }
}
