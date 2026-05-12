'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { logActivity } from '@/lib/activity-log'

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
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const villaId = user.villaId
  try {
    const nights = Math.ceil(
      (data.checkOut.getTime() - data.checkIn.getTime()) / 86400000
    )
    const room = await db.room.findUnique({ where: { id: data.roomId } })
    if (!room) return { success: false, message: 'Kamar tidak ditemukan.' }

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

    await logActivity({ villaId, staffName: user.name, action: `Created reservation for ${data.guestName} → ${room.name}`, module: 'Front Desk' })

    revalidatePath('/front-desk')
    revalidatePath('/dashboard')
    return { success: true, data: reservation }
  } catch (error) {
    console.error('createReservation error:', error)
    return { success: false, message: 'Gagal menyimpan reservasi. Coba lagi.' }
  }
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
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const villaId = user.villaId
  try {
    const reservation = await db.reservation.findUnique({
      where: { id },
      include: { room: true, guest: true },
    })
    if (!reservation) return { success: false, message: 'Reservasi tidak ditemukan.' }

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
      await logActivity({ villaId, staffName: user.name, action: `Checked out guest: ${reservation.guest.name} → ${reservation.room.name}`, module: 'Front Desk' })
    } else if (data.status === 'CHECKEDIN') {
      await db.room.update({ where: { id: reservation.roomId }, data: { status: 'OCCUPIED' } })
      await logActivity({ villaId, staffName: user.name, action: `Checked in guest: ${reservation.guest.name} → ${reservation.room.name}`, module: 'Front Desk' })
    }

    if (data.paymentStatus === 'PAID' && reservation.paymentStatus === 'UNPAID') {
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
    return { success: true }
  } catch (error) {
    console.error('updateReservation error:', error)
    return { success: false, message: 'Gagal memperbarui reservasi. Coba lagi.' }
  }
}

export async function markAsPaid(reservationId: string) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const villaId = user.villaId
  try {
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: { room: true, guest: true },
    })
    if (!reservation) return { success: false, message: 'Reservasi tidak ditemukan.' }
    if (reservation.paymentStatus === 'PAID') return { success: true }

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

    await logActivity({ villaId, staffName: user.name, action: `Marked payment as paid: ${reservation.guest.name} (${reservation.room.name})`, module: 'Front Desk' })

    revalidatePath('/front-desk')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('markAsPaid error:', error)
    return { success: false, message: 'Gagal memproses pembayaran. Coba lagi.' }
  }
}

export async function cancelReservation(reservationId: string) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  try {
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: { guest: true, room: true },
    })
    if (!reservation) return { success: false, message: 'Reservasi tidak ditemukan.' }

    await db.reservation.update({ where: { id: reservationId }, data: { status: 'CANCELLED' } })
    await db.room.update({ where: { id: reservation.roomId }, data: { status: 'AVAILABLE' } })
    await logActivity({ villaId: user.villaId, staffName: user.name, action: `Cancelled reservation: ${reservation.guest.name} → ${reservation.room.name}`, module: 'Front Desk' })

    revalidatePath('/front-desk')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('cancelReservation error:', error)
    return { success: false, message: 'Gagal membatalkan reservasi. Coba lagi.' }
  }
}

export async function createLostAndFound(data: {
  item: string
  description?: string
  location: string
  foundDate: Date
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  try {
    await db.lostAndFound.create({
      data: {
        item: data.item,
        description: data.description,
        location: data.location,
        foundDate: data.foundDate,
        status: 'FOUND',
        villaId: user.villaId,
      },
    })
    await logActivity({ villaId: user.villaId, staffName: user.name, action: `Added lost item: ${data.item}`, module: 'Front Desk' })
    revalidatePath('/front-desk')
    return { success: true }
  } catch (error) {
    console.error('createLostAndFound error:', error)
    return { success: false, message: 'Gagal menyimpan data. Coba lagi.' }
  }
}

export async function claimLostAndFound(id: string) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  try {
    const item = await db.lostAndFound.findUnique({ where: { id } })
    await db.lostAndFound.update({ where: { id }, data: { status: 'CLAIMED' } })
    if (item) await logActivity({ villaId: user.villaId, staffName: user.name, action: `Marked lost item as claimed: ${item.item}`, module: 'Front Desk' })
    revalidatePath('/front-desk')
    return { success: true }
  } catch (error) {
    console.error('claimLostAndFound error:', error)
    return { success: false, message: 'Gagal memperbarui status. Coba lagi.' }
  }
}
