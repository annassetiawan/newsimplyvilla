import { z } from "zod"

export const ratePlanSchema = z.object({
  roomId: z.string().min(1),
  name: z.string().min(1, "Nama rate plan wajib diisi").max(100),
  basePrice: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  sellMode: z.enum(["per_room", "per_person"]),
  maxPersons: z.coerce.number().int().min(1),
  isRefundable: z.boolean().default(true),
  isActive: z.boolean().default(true),
})

export type RatePlanInput = z.infer<typeof ratePlanSchema>

export const priceOverrideSchema = z.object({
  ratePlanId: z.string().min(1),
  date: z.string(),
  price: z.coerce.number().min(0).nullable(),
  isClosed: z.boolean().default(false),
  minStay: z.coerce.number().int().min(1).nullable().optional(),
  maxStay: z.coerce.number().int().min(1).nullable().optional(),
  closedToArrival: z.boolean().nullable().optional(),
  closedToDeparture: z.boolean().nullable().optional(),
})

export type PriceOverrideInput = z.infer<typeof priceOverrideSchema>

export const priceOverrideRangeSchema = z.object({
  ratePlanId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  price: z.coerce.number().min(0).nullable(),
  isClosed: z.boolean().default(false),
  minStay: z.coerce.number().int().min(1).nullable().optional(),
  maxStay: z.coerce.number().int().min(1).nullable().optional(),
  closedToArrival: z.boolean().nullable().optional(),
  closedToDeparture: z.boolean().nullable().optional(),
})

export type PriceOverrideRangeInput = z.infer<typeof priceOverrideRangeSchema>

export const restrictionSchema = z.object({
  ratePlanId: z.string().min(1),
  minStay: z.coerce.number().int().min(1).default(1),
  maxStay: z.coerce.number().int().min(1).nullable().optional(),
  closedToArrival: z.boolean().default(false),
  closedToDeparture: z.boolean().default(false),
})

export type RestrictionInput = z.infer<typeof restrictionSchema>
