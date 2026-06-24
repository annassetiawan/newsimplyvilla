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

async function getVillaId() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  return user.villaId!
}

// ── Rate Plans ─────────────────────────────────────────────────────────────

export async function getRatePlansByRoom(roomId: string) {
  const villaId = await getVillaId()
  return db.ratePlan.findMany({
    where: { roomId, villaId },
    orderBy: { createdAt: 'asc' },
    include: { restriction: true },
  })
}

export async function getRatePlanById(id: string) {
  const villaId = await getVillaId()
  return db.ratePlan.findUnique({
    where: { id, villaId },
    include: { restriction: true, room: true },
  })
}

export async function createRatePlan(data: unknown) {
  const villaId = await getVillaId()
  const validated = ratePlanSchema.parse(data)

  const result = await db.ratePlan.create({
    data: { ...validated, villaId, basePrice: validated.basePrice },
  })

  revalidatePath('/rooms')
  return { success: true, id: result.id }
}

export async function updateRatePlan(id: string, data: unknown) {
  const villaId = await getVillaId()
  const validated = ratePlanSchema.parse(data)

  await db.ratePlan.update({
    where: { id, villaId },
    data: { ...validated, basePrice: validated.basePrice },
  })

  revalidatePath('/rooms')
  return { success: true }
}

export async function deleteRatePlan(id: string) {
  const villaId = await getVillaId()

  await db.ratePlan.delete({
    where: { id, villaId },
  })

  revalidatePath('/rooms')
  return { success: true }
}

export async function toggleRatePlanActive(id: string, isActive: boolean) {
  const villaId = await getVillaId()

  await db.ratePlan.update({
    where: { id, villaId },
    data: { isActive },
  })

  revalidatePath('/rooms')
  return { success: true }
}

// ── Room-level Calendar (all rate plans) ───────────────────────────────────

export async function getRoomCalendar(roomId: string, startDate: string, endDate: string) {
  const villaId = await getVillaId()

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
    })),
  }))
}

// ── Price Calendar (single rate plan, monthly) ──────────────────────────────

export async function getPriceCalendar(ratePlanId: string, year: number, month: number) {
  const villaId = await getVillaId()

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
  const villaId = await getVillaId()
  const validated = priceOverrideSchema.parse(data)

  const date = new Date(validated.date)

  await db.priceOverride.upsert({
    where: { ratePlanId_date: { ratePlanId: validated.ratePlanId, date } },
    create: { ...validated, date, villaId },
    update: { price: validated.price, isClosed: validated.isClosed },
  })

  revalidatePath('/rooms')
  return { success: true }
}

export async function setPriceOverrideRange(data: unknown) {
  const villaId = await getVillaId()
  const validated = priceOverrideRangeSchema.parse(data)

  const start = new Date(validated.startDate)
  const end = new Date(validated.endDate)
  const dates: Date[] = []

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d))
  }

  await db.$transaction(
    dates.map((date) =>
      db.priceOverride.upsert({
        where: { ratePlanId_date: { ratePlanId: validated.ratePlanId, date } },
        create: {
          ratePlanId: validated.ratePlanId,
          villaId,
          date,
          price: validated.price,
          isClosed: validated.isClosed,
        },
        update: { price: validated.price, isClosed: validated.isClosed },
      })
    )
  )

  revalidatePath('/rooms')
  return { success: true }
}

export async function deletePriceOverride(ratePlanId: string, date: string) {
  const villaId = await getVillaId()

  await db.priceOverride.delete({
    where: {
      ratePlanId_date: { ratePlanId, date: new Date(date) },
      villaId,
    },
  })

  revalidatePath('/rooms')
  return { success: true }
}

// ── Restrictions ────────────────────────────────────────────────────────────

export async function getRestriction(ratePlanId: string) {
  await getVillaId()
  return db.ratePlanRestriction.findUnique({
    where: { ratePlanId },
  })
}

export async function upsertRestriction(data: unknown) {
  const villaId = await getVillaId()
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
  return { success: true }
}
