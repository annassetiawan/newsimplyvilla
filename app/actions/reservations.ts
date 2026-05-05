'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

const VILLA_ID = 'villa-senja-ubud'

export async function createReservation(data: {
  guestName: string
  idNumber?: string
  phone?: string
  roomId: string
  checkIn: Date
  checkOut: Date
  paymentStatus: 'PAID' | 'UNPAID'
}) {
  const nights = Math.ceil(
    (data.checkOut.getTime() - data.checkIn.getTime()) / 86400000
  )
  const room = await db.room.findUnique({ where: { id: data.roomId } })
  if (!room) throw new Error('Room not found')

  const totalAmount = room.pricePerNight * nights

  let guest = await db.guest.findFirst({ where: { name: data.guestName } })
  if (!guest) {
    guest = await db.guest.create({
      data: { name: data.guestName, idNumber: data.idNumber, phone: data.phone },
    })
  }

  const reservation = await db.reservation.create({
    data: {
      guestId: guest.id,
      roomId: data.roomId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      status: 'CONFIRMED',
      paymentStatus: data.paymentStatus,
      totalAmount,
    },
  })

  await db.room.update({ where: { id: data.roomId }, data: { status: 'OCCUPIED' } })

  if (data.paymentStatus === 'PAID') {
    await db.transaction.create({
      data: {
        date: new Date(),
        type: 'INCOME',
        description: `Reservation — ${data.guestName} (${room.code})`,
        amount: totalAmount,
        category: 'Accommodation',
        paymentStatus: 'PAID',
        reservationId: reservation.id,
        villaId: VILLA_ID,
      },
    })
  }

  revalidatePath('/front-desk')
  revalidatePath('/dashboard')
  return reservation
}

export async function cancelReservation(reservationId: string) {
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
  })
  if (!reservation) throw new Error('Reservation not found')

  await db.reservation.update({ where: { id: reservationId }, data: { status: 'CANCELLED' } })
  await db.room.update({ where: { id: reservation.roomId }, data: { status: 'AVAILABLE' } })

  revalidatePath('/front-desk')
  revalidatePath('/dashboard')
}

export async function createLostAndFound(data: {
  item: string
  description?: string
  location: string
  foundDate: Date
}) {
  await db.lostAndFound.create({
    data: {
      item: data.item,
      description: data.description,
      location: data.location,
      foundDate: data.foundDate,
      status: 'FOUND',
      villaId: VILLA_ID,
    },
  })
  revalidatePath('/front-desk')
}

export async function claimLostAndFound(id: string) {
  await db.lostAndFound.update({ where: { id }, data: { status: 'CLAIMED' } })
  revalidatePath('/front-desk')
}
