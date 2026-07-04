import { db } from '@/lib/db'
import { ChannexClient } from './client'
import { saveMapping } from './sync'
import { pushAvailability } from './ari'

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Actual Channex JSON:API shape after client unwraps json.data
interface ChannexRevisionRaw {
  id: string
  type: string
  attributes: {
    id: string
    status: 'new' | 'cancelled' | 'modified'
    booking_id: string
    property_id: string
    ota_name: string
    ota_reservation_code?: string
    arrival_date: string
    departure_date: string
    amount: string
    currency: string
    customer: {
      name: string
      surname: string
      mail?: string
      phone?: string
    }
    rooms: Array<{
      room_type_id: string
      rate_plan_id: string
      checkin_date: string
      checkout_date: string
      amount: string
      days: Record<string, string>
      guests: Array<{ name: string; surname: string }>
    }>
  }
}

export async function processRevisionById(
  revisionId: string,
  villaId: string,
  client: ChannexClient
): Promise<void> {
  const raw = await client.get<ChannexRevisionRaw>(`/booking_revisions/${revisionId}`)
  const attrs = raw.attributes

  const status = attrs?.status
  const bookingId = attrs?.booking_id

  if (!status || !bookingId) {
    console.error('[Channex] Revision missing status/booking_id:', JSON.stringify(raw))
    await client.post(`/booking_revisions/${revisionId}/ack`, {})
    return
  }

  const result = await applyRevision(status, bookingId, attrs, villaId)

  if (!result.applied) {
    console.error(`[Channex] Could not apply revision ${revisionId}: ${result.reason}`)
  }
  // Always ack to prevent blocking the feed
  await client.post(`/booking_revisions/${revisionId}/ack`, {})
}

async function applyRevision(
  status: string,
  bookingId: string,
  attrs: ChannexRevisionRaw['attributes'],
  villaId: string
): Promise<{ applied: boolean; reason?: string }> {
  if (status === 'new') {
    // Dedupe
    const existing = await db.reservation.findFirst({ where: { channexBookingId: bookingId } })
    if (existing) return { applied: true, reason: 'duplicate' }

    const room = attrs.rooms?.[0]
    if (!room) return { applied: false, reason: 'no room in booking' }

    const mapping = await db.channexMapping.findFirst({
      where: { villaId, kind: 'room_type', channexId: room.room_type_id },
    })
    if (!mapping) return { applied: false, reason: `no room mapping for ${room.room_type_id}` }

    // Guest name from customer field (more reliable than room guests)
    const customer = attrs.customer
    const guestName = [customer?.name, customer?.surname].filter(Boolean).join(' ') || 'OTA Guest'
    const phone = customer?.phone ?? undefined
    const email = customer?.mail ?? undefined

    const checkIn = new Date(room.checkin_date)
    const checkOut = new Date(room.checkout_date)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000)

    // Price from days map (IDR, already in base unit — not minor units)
    const dayPrices = Object.values(room.days ?? {}).map(Number)
    const pricePerNight = dayPrices.length > 0
      ? dayPrices.reduce((a, b) => a + b, 0) / dayPrices.length
      : Number(room.amount) / Math.max(nights, 1)

    let dbGuest = await db.guest.findFirst({ where: { name: guestName } })
    if (!dbGuest) {
      dbGuest = await db.guest.create({ data: { name: guestName, phone, email } })
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
        channexBookingId: bookingId,
        otaName: attrs.ota_name,
        otaReservationCode: attrs.ota_reservation_code ?? null,
      },
    })

    await saveMapping(villaId, 'booking', reservation.id, bookingId)

    // Notify staff of new OTA booking
    void db.notification.create({
      data: {
        id: `notif_${Date.now()}`,
        villaId,
        type: 'booking_new',
        title: `Booking baru dari ${attrs.ota_name}`,
        body: `${guestName} · ${room.checkin_date} → ${room.checkout_date} · ${attrs.ota_reservation_code ?? bookingId}`,
        link: '/front-desk',
      },
    }).catch(console.error)

    void pushAvailability(
      villaId,
      mapping.localId,
      room.checkin_date,
      toISO(new Date(checkOut.getTime() - 86400000))
    ).catch(console.error)

    return { applied: true }
  }

  if (status === 'cancelled') {
    const reservation = await db.reservation.findFirst({ where: { channexBookingId: bookingId } })
    if (!reservation) return { applied: false, reason: 'reservation not found for cancellation' }

    await db.reservation.update({ where: { id: reservation.id }, data: { status: 'CANCELLED' } })

    void db.notification.create({
      data: {
        id: `notif_${Date.now()}`,
        villaId,
        type: 'booking_cancelled',
        title: 'Booking dibatalkan',
        body: `Reservasi ${bookingId.slice(0, 8)}… telah dibatalkan oleh OTA`,
        link: '/front-desk',
      },
    }).catch(console.error)

    const dateFrom = toISO(reservation.checkIn)
    const dateTo = toISO(new Date(reservation.checkOut.getTime() - 86400000))
    void pushAvailability(villaId, reservation.roomId, dateFrom, dateTo).catch(console.error)

    return { applied: true }
  }

  if (status === 'modified') {
    console.warn(`[Channex] Booking modification for ${bookingId} — manual review needed`)
    return { applied: true, reason: 'modification logged' }
  }

  return { applied: false, reason: `unknown status: ${status}` }
}
