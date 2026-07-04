import { db } from '@/lib/db'
import { ChannexClient } from './client'
import { getMapping, saveMapping } from './sync'
import { pushAvailability } from './ari'

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

interface ChannexRevision {
  id: string
  status: 'new' | 'cancelled' | 'modified'
  booking: {
    id: string
    ota_name: string
    ota_reservation_code?: string
    property_id: string
    rooms: Array<{
      room_type_id: string
      checkin_date: string
      checkout_date: string
      rate: string
      guests: Array<{
        first_name?: string
        last_name?: string
        phone?: string
        email?: string
      }>
    }>
  }
}

export async function applyRevision(
  revision: ChannexRevision,
  villaId: string,
  client: ChannexClient
): Promise<{ applied: boolean; reason?: string }> {
  const { status, booking } = revision

  if (status === 'new') {
    // Dedupe
    const existing = await db.reservation.findFirst({
      where: { channexBookingId: booking.id },
    })
    if (existing) return { applied: true, reason: 'duplicate' }

    const room = booking.rooms[0]
    if (!room) return { applied: false, reason: 'no room in booking' }

    // Find local roomId from channex room_type_id mapping
    const mapping = await db.channexMapping.findFirst({
      where: { villaId, kind: 'room_type', channexId: room.room_type_id },
    })
    if (!mapping) return { applied: false, reason: `no room mapping for ${room.room_type_id}` }

    const guest = room.guests[0]
    const guestName =
      [guest?.first_name, guest?.last_name].filter(Boolean).join(' ') || 'OTA Guest'
    const phone = guest?.phone ?? undefined

    const checkIn = new Date(room.checkin_date)
    const checkOut = new Date(room.checkout_date)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000)
    const pricePerNight = room.rate ? Number(room.rate) / 100 : 0

    let dbGuest = await db.guest.findFirst({ where: { name: guestName } })
    if (!dbGuest) {
      dbGuest = await db.guest.create({
        data: { name: guestName, phone, email: guest?.email ?? undefined },
      })
    }

    const reservation = await db.reservation.create({
      data: {
        guestId: dbGuest.id,
        roomId: mapping.localId,
        checkIn,
        checkOut,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        pricePerNight,
        totalAmount: pricePerNight * nights,
        channexBookingId: booking.id,
        otaName: booking.ota_name,
        otaReservationCode: booking.ota_reservation_code ?? null,
      },
    })

    await saveMapping(villaId, 'booking', reservation.id, booking.id)

    // Push availability so the dates show as blocked
    void pushAvailability(
      villaId,
      mapping.localId,
      room.checkin_date,
      toISO(new Date(checkOut.getTime() - 86400000))
    ).catch(console.error)

    return { applied: true }
  }

  if (status === 'cancelled') {
    const reservation = await db.reservation.findFirst({
      where: { channexBookingId: booking.id },
    })
    if (!reservation) return { applied: false, reason: 'reservation not found for cancellation' }

    await db.reservation.update({
      where: { id: reservation.id },
      data: { status: 'CANCELLED' },
    })

    // Free up availability
    const dateFrom = toISO(reservation.checkIn)
    const dateTo = toISO(new Date(reservation.checkOut.getTime() - 86400000))
    void pushAvailability(villaId, reservation.roomId, dateFrom, dateTo).catch(console.error)

    return { applied: true }
  }

  if (status === 'modified') {
    // Don't auto-apply modifications — log and surface to staff
    console.warn(`[Channex] Booking modification received for ${booking.id} — manual review needed`)
    return { applied: true, reason: 'modification logged, manual review required' }
  }

  return { applied: false, reason: `unknown status: ${status}` }
}

export async function processRevisionById(
  revisionId: string,
  villaId: string,
  client: ChannexClient
): Promise<void> {
  const raw = await client.get<Record<string, unknown>>(`/booking_revisions/${revisionId}`)
  console.log('[Channex] revision raw:', JSON.stringify(raw))

  // Handle both flat and JSON:API (attributes-nested) response shapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attrs = (raw as any)?.attributes ?? raw
  const revision: ChannexRevision = {
    id: String(raw.id ?? revisionId),
    status: (attrs.status ?? attrs.kind) as ChannexRevision['status'],
    booking: attrs.booking ?? (raw as any).booking,
  }

  const result = await applyRevision(revision, villaId, client)
  if (result.applied) {
    await client.post(`/booking_revisions/${revisionId}/ack`, {})
  } else {
    console.error(`[Channex] Could not apply revision ${revisionId}: ${result.reason}`)
    // Still ack to avoid blocking the feed, but log for monitoring
    await client.post(`/booking_revisions/${revisionId}/ack`, {})
  }
}
