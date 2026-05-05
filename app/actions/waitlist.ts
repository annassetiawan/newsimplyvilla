'use server'

import { db } from '@/lib/db'

export async function joinWaitlist(email: string) {
  const existing = await db.waitlist.findUnique({ where: { email } })
  if (existing) {
    return { success: false, message: 'Email sudah terdaftar di waitlist.' }
  }

  await db.waitlist.create({ data: { email, plan: 'PRO' } })

  return { success: true, message: 'Berhasil! Kami akan notifikasi kamu saat Pro tersedia.' }
}
