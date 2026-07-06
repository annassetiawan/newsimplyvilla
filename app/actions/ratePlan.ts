'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import {
  ratePlanSchema,
  priceOverrideSchema,
  priceOverrideRangeSchema,
  restrictionSchema,
} from '@/lib/validations/ratePlan'
import { syncRatePlan, deleteMapping } from '@/lib/channex/sync'
import { pushRatesAndRestrictions, pushRatesForDays } from '@/lib/channex/ari'
import { getChannexClient } from '@/lib/channex/getClient'

async function getSessionVillaId() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  return user.villaId!
}

// ── Rate Plans ─────────────────────────────────────────────────────────────

export async function getRatePlansByRoom(roomId: string) {
  const villaId = await getSessionVillaId()
  return db.ratePlan.findMany({
    where: { roomId, villaId },
    orderBy: { createdAt: 'asc' },
    include: { restriction: true },
  })
}

export async function getRatePlanById(id: string) {
  const villaId = await getSessionVillaId()
  return db.ratePlan.findUnique({
    where: { id, villaId },
    include: { restriction: true, room: true },
  })
}

export async function createRatePlan(data: unknown) {
  const villaId = await getSessionVillaId()
  const validated = ratePlanSchema.parse(data)

  const result = await db.ratePlan.create({
    data: { ...validated, villaId, basePrice: validated.basePrice },
  })

  revalidatePath('/rooms')
  revalidatePath('/rate-plans')

  // Sync to Channex and push initial ARI (fire-and-forget)
  void (async () => {
    const client = await getChannexClient(villaId)
    if (!client) return
    await syncRatePlan(villaId, result.id, client)
    await pushRatesForDays(villaId, result.id, 500)
  })().catch(console.error)

  return { success: true, id: result.id }
}

export async function updateRatePlan(id: string, data: unknown) {
  const villaId = await getSessionVillaId()
  const validated = ratePlanSchema.parse(data)

  await db.ratePlan.update({
    where: { id, villaId },
    data: { ...validated, basePrice: validated.basePrice },
  })

  revalidatePath('/rooms')
  revalidatePath('/rate-plans')

  // Push updated rates for next year (fire-and-forget)
  void pushRatesForDays(villaId, id, 500).catch(console.error)

  return { success: true }
}

export async function deleteRatePlan(id: string) {
  const villaId = await getSessionVillaId()

  await db.ratePlan.delete({
    where: { id, villaId },
  })

  // Remove mapping so future pushes skip this plan
  void deleteMapping(villaId, 'rate_plan', id).catch(console.error)

  revalidatePath('/rooms')
  revalidatePath('/rate-plans')
  return { success: true }
}

export async function toggleRatePlanActive(id: string, isActive: boolean) {
  const villaId = await getSessionVillaId()

  await db.ratePlan.update({
    where: { id, villaId },
    data: { isActive },
  })

  revalidatePath('/rooms')
  revalidatePath('/rate-plans')
  return { success: true }
}

// ── Room-level Calendar (all rate plans) ───────────────────────────────────

export async function getRoomCalendar(roomId: string, startDate: string, endDate: string) {
  const villaId = await getSessionVillaId()

  const start = new Date(startDate)
  const end = new Date(endDate)

  const ratePlans = await db.ratePlan.findMany({
    where: { roomId, villaId },
    orderBy: { createdAt: 'asc' },
    include: {
      priceOverrides: {
        where: {
          date: { gte: start, lte: end },
        },
      },
    },
  })

  return ratePlans.map((rp) => ({
    id: rp.id,
    name: rp.name,
    basePrice: Number(rp.basePrice),
    sellMode: rp.sellMode,
    maxPersons: rp.maxPersons,
    isRefundable: rp.isRefundable,
    isActive: rp.isActive,
    roomId: rp.roomId,
    overrides: rp.priceOverrides.map((o) => ({
      id: o.id,
      ratePlanId: o.ratePlanId,
      date: o.date.toISOString().split('T')[0],
      price: o.price !== null ? Number(o.price) : null,
      isClosed: o.isClosed,
      minStay: o.minStay ?? null,
      maxStay: o.maxStay ?? null,
      closedToArrival: o.closedToArrival ?? null,
      closedToDeparture: o.closedToDeparture ?? null,
    })),
  }))
}

// ── Villa-wide Calendar (all rooms, all rate plans) ────────────────────────

export async function getVillaCalendar(startDate: string, endDate: string, roomId?: string) {
  const villaId = await getSessionVillaId()

  const start = new Date(startDate)
  const end = new Date(endDate)

  const ratePlans = await db.ratePlan.findMany({
    where: { villaId, ...(roomId ? { roomId } : {}) },
    orderBy: [{ room: { code: 'asc' } }, { createdAt: 'asc' }],
    include: {
      room: { select: { code: true, name: true } },
      priceOverrides: {
        where: { date: { gte: start, lte: end } },
      },
    },
  })

  return ratePlans.map((rp) => ({
    id: rp.id,
    name: rp.name,
    basePrice: Number(rp.basePrice),
    sellMode: rp.sellMode,
    maxPersons: rp.maxPersons,
    isRefundable: rp.isRefundable,
    isActive: rp.isActive,
    roomId: rp.roomId,
    roomCode: rp.room.code,
    roomName: rp.room.name,
    overrides: rp.priceOverrides.map((o) => ({
      id: o.id,
      ratePlanId: o.ratePlanId,
      date: o.date.toISOString().split('T')[0],
      price: o.price !== null ? Number(o.price) : null,
      isClosed: o.isClosed,
      minStay: o.minStay ?? null,
      maxStay: o.maxStay ?? null,
      closedToArrival: o.closedToArrival ?? null,
      closedToDeparture: o.closedToDeparture ?? null,
    })),
  }))
}

// ── Price Calendar (single rate plan, monthly) ──────────────────────────────

export async function getPriceCalendar(ratePlanId: string, year: number, month: number) {
  const villaId = await getSessionVillaId()

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  return db.priceOverride.findMany({
    where: {
      ratePlanId,
      villaId,
      date: { gte: startDate, lte: endDate },
    },
  })
}

export async function setPriceOverride(data: unknown) {
  const villaId = await getSessionVillaId()
  const validated = priceOverrideSchema.parse(data)

  const date = new Date(validated.date)

  const restrictionFields = {
    minStay: validated.minStay ?? null,
    maxStay: validated.maxStay ?? null,
    closedToArrival: validated.closedToArrival ?? null,
    closedToDeparture: validated.closedToDeparture ?? null,
  }

  await db.priceOverride.upsert({
    where: { ratePlanId_date: { ratePlanId: validated.ratePlanId, date } },
    create: { ratePlanId: validated.ratePlanId, date, villaId, price: validated.price, isClosed: validated.isClosed, ...restrictionFields },
    update: { price: validated.price, isClosed: validated.isClosed, ...restrictionFields },
  })

  revalidatePath('/rooms')
  revalidatePath('/rate-plans')

  // Push updated rate for this specific date (fire-and-forget)
  void pushRatesAndRestrictions(villaId, validated.ratePlanId, [validated.date]).catch(console.error)

  return { success: true }
}

export async function setPriceOverrideRange(data: unknown) {
  const villaId = await getSessionVillaId()
  const validated = priceOverrideRangeSchema.parse(data)

  const start = new Date(validated.startDate)
  const end = new Date(validated.endDate)
  const dateDates: Date[] = []
  const dateStrings: string[] = []

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dateDates.push(new Date(d))
    dateStrings.push(d.toISOString().split('T')[0])
  }

  const restrictionFields = {
    minStay: validated.minStay ?? null,
    maxStay: validated.maxStay ?? null,
    closedToArrival: validated.closedToArrival ?? null,
    closedToDeparture: validated.closedToDeparture ?? null,
  }

  await db.$transaction(
    dateDates.map((date) =>
      db.priceOverride.upsert({
        where: { ratePlanId_date: { ratePlanId: validated.ratePlanId, date } },
        create: { ratePlanId: validated.ratePlanId, villaId, date, price: validated.price, isClosed: validated.isClosed, ...restrictionFields },
        update: { price: validated.price, isClosed: validated.isClosed, ...restrictionFields },
      })
    )
  )

  revalidatePath('/rooms')
  revalidatePath('/rate-plans')

  // Push updated rates for the range (fire-and-forget)
  void pushRatesAndRestrictions(villaId, validated.ratePlanId, dateStrings).catch(console.error)

  return { success: true }
}

export async function deletePriceOverride(ratePlanId: string, date: string) {
  const villaId = await getSessionVillaId()

  await db.priceOverride.delete({
    where: {
      ratePlanId_date: { ratePlanId, date: new Date(date) },
      villaId,
    },
  })

  revalidatePath('/rooms')
  revalidatePath('/rate-plans')

  // Push reset (will send basePrice) for this date (fire-and-forget)
  void pushRatesAndRestrictions(villaId, ratePlanId, [date]).catch(console.error)

  return { success: true }
}

// ── Restrictions ────────────────────────────────────────────────────────────

export async function getRestriction(ratePlanId: string) {
  await getSessionVillaId()
  return db.ratePlanRestriction.findUnique({
    where: { ratePlanId },
  })
}

export async function upsertRestriction(data: unknown) {
  const villaId = await getSessionVillaId()
  const validated = restrictionSchema.parse(data)

  await db.ratePlanRestriction.upsert({
    where: { ratePlanId: validated.ratePlanId },
    create: { ...validated, villaId },
    update: {
      minStay: validated.minStay,
      maxStay: validated.maxStay ?? null,
      closedToArrival: validated.closedToArrival,
      closedToDeparture: validated.closedToDeparture,
    },
  })

  revalidatePath('/rooms')
  revalidatePath('/rate-plans')

  // Push restrictions for next year (fire-and-forget)
  void pushRatesForDays(villaId, validated.ratePlanId, 500).catch(console.error)

  return { success: true }
}
