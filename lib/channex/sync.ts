import { db } from '@/lib/db'
import { ChannexClient } from './client'
import { getChannexClientRequired } from './getClient'
import { getMapping, saveMapping, deleteMapping } from './mapping'
import { pushRatesForDays } from './ari'

export { deleteMapping }

// ── Property sync ────────────────────────────────────────────────────────────

async function syncProperty(villaId: string, client: ChannexClient): Promise<string> {
  const villa = await db.villa.findUniqueOrThrow({ where: { id: villaId } })
  const existing = await getMapping(villaId, 'property', villaId)

  type PropertyRes = { id: string }

  if (existing) {
    await client.put<PropertyRes>(`/properties/${existing}`, {
      property: { title: villa.name, currency: 'IDR', email: villa.email ?? undefined },
    })
    return existing
  }

  const data = await client.post<PropertyRes>('/properties', {
    property: {
      title: villa.name,
      currency: 'IDR',
      email: villa.email ?? undefined,
      country: 'ID',
      timezone: 'Asia/Makassar',
    },
  })
  const channexPropertyId = (data as unknown as { id: string }).id
  await saveMapping(villaId, 'property', villaId, channexPropertyId)
  await db.channexConfig.update({
    where: { villaId },
    data: { channexPropertyId },
  })
  return channexPropertyId
}

// ── Room type sync ───────────────────────────────────────────────────────────

async function syncRoomType(villaId: string, roomId: string, client: ChannexClient): Promise<string> {
  const room = await db.room.findUniqueOrThrow({ where: { id: roomId } })
  const channexPropertyId = await getMapping(villaId, 'property', villaId)
  if (!channexPropertyId) throw new Error('Property not synced yet')

  const existing = await getMapping(villaId, 'room_type', roomId)

  type RoomTypeRes = { id: string }

  const attrs = {
    property_id: channexPropertyId,
    title: room.name,
    count_of_rooms: 1,
    occ_adults: room.capacity,
    occ_children: 0,
    occ_infants: 0,
    default_occupancy: Math.min(room.capacity, 2),
    room_kind: 'room',
  }

  if (existing) {
    await client.put<RoomTypeRes>(`/room_types/${existing}`, { room_type: attrs })
    return existing
  }

  const data = await client.post<RoomTypeRes>('/room_types', { room_type: attrs })
  const channexId = (data as unknown as { id: string }).id
  await saveMapping(villaId, 'room_type', roomId, channexId)
  return channexId
}

// ── Rate plan sync ───────────────────────────────────────────────────────────

export async function syncRatePlan(villaId: string, ratePlanId: string, client: ChannexClient): Promise<string> {
  const rp = await db.ratePlan.findUniqueOrThrow({ where: { id: ratePlanId } })
  const channexPropertyId = await getMapping(villaId, 'property', villaId)
  const channexRoomTypeId = await getMapping(villaId, 'room_type', rp.roomId)
  if (!channexPropertyId || !channexRoomTypeId) throw new Error('Property or room type not synced yet')

  const existing = await getMapping(villaId, 'rate_plan', ratePlanId)

  type RatePlanRes = { id: string }

  const attrs = {
    property_id: channexPropertyId,
    room_type_id: channexRoomTypeId,
    title: rp.name,
    currency: 'IDR',
    sell_mode: rp.sellMode,
    rate_mode: 'manual',
    options: [{ occupancy: rp.maxPersons, is_primary: true, rate: 0 }],
  }

  if (existing) {
    await client.put<RatePlanRes>(`/rate_plans/${existing}`, { rate_plan: attrs })
    return existing
  }

  const data = await client.post<RatePlanRes>('/rate_plans', { rate_plan: attrs })
  const channexId = (data as unknown as { id: string }).id
  await saveMapping(villaId, 'rate_plan', ratePlanId, channexId)
  return channexId
}

// ── Initial full sync ─────────────────────────────────────────────────────────

export async function initialSync(villaId: string): Promise<{
  property: string
  roomTypes: number
  ratePlans: number
}> {
  const client = await getChannexClientRequired(villaId)

  const channexPropertyId = await syncProperty(villaId, client)

  const rooms = await db.room.findMany({ where: { villaId } })
  for (const room of rooms) {
    await syncRoomType(villaId, room.id, client)
  }

  const ratePlans = await db.ratePlan.findMany({ where: { villaId } })
  for (const rp of ratePlans) {
    await syncRatePlan(villaId, rp.id, client)
  }

  // Push rates after syncing rate plan structure
  for (const rp of ratePlans) {
    await pushRatesForDays(villaId, rp.id, 365)
  }

  await db.channexConfig.update({
    where: { villaId },
    data: { lastSyncAt: new Date() },
  })

  return {
    property: channexPropertyId,
    roomTypes: rooms.length,
    ratePlans: ratePlans.length,
  }
}
