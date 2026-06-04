import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const bookingSchema = z.object({
  villaId: z.string().min(1),
  guestName: z.string().min(1, 'Nama wajib diisi'),
  guestEmail: z.string().email('Email tidak valid').optional().or(z.literal('')),
  guestPhone: z.string().optional().or(z.literal('')),
  roomId: z.string().min(1, 'Kamar wajib dipilih'),
  checkIn: z.string().min(1, 'Tanggal check-in wajib diisi'),
  checkOut: z.string().min(1, 'Tanggal check-out wajib diisi'),
  notes: z.string().optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = bookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { villaId, guestName, guestEmail, guestPhone, roomId, checkIn, checkOut, notes } =
      parsed.data

    // Validate villa
    const villa = await db.villa.findUnique({ where: { id: villaId } })
    if (!villa) {
      return NextResponse.json(
        { success: false, message: 'Villa tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Validate room belongs to villa
    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room || room.villaId !== villaId) {
      return NextResponse.json(
        { success: false, message: 'Kamar tidak ditemukan.' },
        { status: 404 }
      )
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Format tanggal tidak valid.' },
        { status: 400 }
      )
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / 86400000
    )

    if (nights <= 0) {
      return NextResponse.json(
        { success: false, message: 'Check-out harus setelah check-in.' },
        { status: 400 }
      )
    }

    // Check for conflicting reservations
    const conflicting = await db.reservation.findFirst({
      where: {
        roomId,
        status: { notIn: ['CANCELLED', 'CHECKEDOUT'] },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    })

    if (conflicting) {
      return NextResponse.json(
        { success: false, message: 'Kamar sudah dibooking untuk tanggal tersebut.' },
        { status: 409 }
      )
    }

    // Find or create guest
    let guest = null
    if (guestEmail) {
      guest = await db.guest.findFirst({ where: { email: guestEmail } })
    }
    if (!guest && guestPhone) {
      guest = await db.guest.findFirst({ where: { phone: guestPhone, name: guestName } })
    }
    if (!guest) {
      guest = await db.guest.create({
        data: {
          name: guestName,
          email: guestEmail || null,
          phone: guestPhone || null,
          notes: notes || null,
        },
      })
    }

    const totalAmount = room.pricePerNight * nights

    // Create reservation
    const reservation = await db.reservation.create({
      data: {
        guestId: guest.id,
        roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        pricePerNight: room.pricePerNight,
        totalAmount,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        reservationId: reservation.id,
        totalAmount,
        nights,
        pricePerNight: room.pricePerNight,
      },
    })
  } catch (error) {
    console.error('POST /api/booking error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan booking. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
