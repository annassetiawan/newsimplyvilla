'use server'

import { db } from '@/lib/db'

export async function joinWaitlist(email: string) {
  try {
    const existing = await db.waitlist.findUnique({ where: { email } })
    if (existing) {
      return { success: false, message: 'Email sudah terdaftar di waitlist.' }
    }
    await db.waitlist.create({ data: { email, plan: 'PRO' } })
    return { success: true, message: 'Berhasil! Kami akan notifikasi kamu saat Pro tersedia.' }
  } catch (error) {
    console.error('joinWaitlist error:', error)
    return { success: false, message: 'Gagal mendaftar waitlist. Coba lagi.' }
  }
}
