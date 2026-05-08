'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'

async function getVillaId() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user.villaId
}

export async function createReservation(data: {
  guestName: string
  idNumber?: string
  phone?: string
  roomId: string
  checkIn: Date
  checkOut: Date
  paymentStatus: 'PAID' | 'UNPAID'
}) {
  const villaId = await getVillaId()

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
      pricePerNight: room.pricePerNight,
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
        villaId,
      },
    })
  }

  revalidatePath('/front-desk')
  revalidatePath('/dashboard')
  return reservation
}

export async function updateReservation(
  id: string,
  data: {
    checkIn: Date
    checkOut: Date
    status: 'CONFIRMED' | 'PENDING' | 'CHECKEDIN' | 'CHECKEDOUT'
    paymentStatus: 'PAID' | 'UNPAID'
  }
) {
  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { room: true, guest: true },
  })
  if (!reservation) throw new Error('Reservation not found')

  const nights = Math.max(
    1,
    Math.ceil((data.checkOut.getTime() - data.checkIn.getTime()) / 86400000)
  )
  const totalAmount = reservation.pricePerNight * nights

  await db.reservation.update({
    where: { id },
    data: {
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      totalAmount,
      status: data.status,
      paymentStatus: data.paymentStatus,
    },
  })

  if (data.status === 'CHECKEDOUT') {
    await db.room.update({ where: { id: reservation.roomId }, data: { status: 'AVAILABLE' } })
  } else if (data.status === 'CHECKEDIN') {
    await db.room.update({ where: { id: reservation.roomId }, data: { status: 'OCCUPIED' } })
  }

  if (data.paymentStatus === 'PAID' && reservation.paymentStatus === 'UNPAID') {
    const villaId = await getVillaId()
    const existing = await db.transaction.findFirst({ where: { reservationId: id } })
    if (!existing) {
      await db.transaction.create({
        data: {
          date: new Date(),
          type: 'INCOME',
          description: `Reservation — ${reservation.guest.name} (${reservation.room.code})`,
          amount: totalAmount,
          category: 'Accommodation',
          paymentStatus: 'PAID',
          reservationId: id,
          villaId,
        },
      })
    }
  }

  revalidatePath('/front-desk')
  revalidatePath('/dashboard')
}

export async function markAsPaid(reservationId: string) {
  const villaId = await getVillaId()

  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    include: { room: true, guest: true },
  })
  if (!reservation) throw new Error('Reservation not found')
  if (reservation.paymentStatus === 'PAID') return

  await db.reservation.update({
    where: { id: reservationId },
    data: { paymentStatus: 'PAID' },
  })

  await db.transaction.create({
    data: {
      date: new Date(),
      type: 'INCOME',
      description: `Reservation — ${reservation.guest.name} (${reservation.room.code})`,
      amount: reservation.totalAmount,
      category: 'Accommodation',
      paymentStatus: 'PAID',
      reservationId: reservation.id,
      villaId,
    },
  })

  revalidatePath('/front-desk')
  revalidatePath('/dashboard')
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
  const villaId = await getVillaId()
  await db.lostAndFound.create({
    data: {
      item: data.item,
      description: data.description,
      location: data.location,
      foundDate: data.foundDate,
      status: 'FOUND',
      villaId,
    },
  })
  revalidatePath('/front-desk')
}

export async function claimLostAndFound(id: string) {
  await db.lostAndFound.update({ where: { id }, data: { status: 'CLAIMED' } })
  revalidatePath('/front-desk')
}
