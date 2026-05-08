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

export async function updateGuestNotes(guestId: string, notes: string) {
  const villaId = await getVillaId()

  const guest = await db.guest.findFirst({
    where: { id: guestId, reservations: { some: { room: { villaId } } } },
  })
  if (!guest) throw new Error('Guest not found')

  await db.guest.update({
    where: { id: guestId },
    data: { notes: notes.trim() || null },
  })

  revalidatePath(`/front-desk/guests/${guestId}`)
}
