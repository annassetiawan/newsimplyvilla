'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { logActivity } from '@/lib/activity-log'

// ─── Business CRUD ──────────────────────────────────────────────────────────

export async function createBusiness(data: {
  name: string
  type: string
  description?: string
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  try {
    await db.business.create({
      data: { ...data, villaId: user.villaId },
    })
    await logActivity({
      villaId: user.villaId,
      staffName: user.name,
      action: `Tambah bisnis: ${data.name}`,
      module: 'Business',
    })
    revalidatePath('/business')
    return { success: true }
  } catch (error) {
    console.error('createBusiness error:', error)
    return { success: false, message: 'Gagal membuat bisnis. Coba lagi.' }
  }
}

export async function updateBusiness(
  id: string,
  data: {
    name?: string
    type?: string
    description?: string
    status?: 'ACTIVE' | 'INACTIVE'
  }
) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  try {
    await db.business.update({
      where: { id, villaId: user.villaId },
      data,
    })
    revalidatePath('/business')
    return { success: true }
  } catch (error) {
    console.error('updateBusiness error:', error)
    return { success: false, message: 'Gagal memperbarui bisnis. Coba lagi.' }
  }
}

export async function deleteBusiness(id: string) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  try {
    const biz = await db.business.findUnique({ where: { id, villaId: user.villaId } })
    await db.business.delete({ where: { id, villaId: user.villaId } })
    if (biz) {
      await logActivity({
        villaId: user.villaId,
        staffName: user.name,
        action: `Hapus bisnis: ${biz.name}`,
        module: 'Business',
      })
    }
    revalidatePath('/business')
    return { success: true }
  } catch (error) {
    console.error('deleteBusiness error:', error)
    return { success: false, message: 'Gagal menghapus bisnis. Coba lagi.' }
  }
}

// ─── BusinessItem CRUD ──────────────────────────────────────────────────────

export async function createBusinessItem(data: {
  businessId: string
  name: string
  price: number
  category: string
  photo?: string
  stock: number
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  try {
    await db.businessItem.create({
      data: { ...data, villaId: user.villaId },
    })
    revalidatePath('/business')
    return { success: true }
  } catch (error) {
    console.error('createBusinessItem error:', error)
    return { success: false, message: 'Gagal menambah item. Coba lagi.' }
  }
}

export async function updateBusinessItem(
  id: string,
  data: {
    name?: string
    price?: number
    category?: string
    photo?: string
    stock?: number
  }
) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  try {
    await db.businessItem.update({
      where: { id, villaId: user.villaId },
      data,
    })
    revalidatePath('/business')
    return { success: true }
  } catch (error) {
    console.error('updateBusinessItem error:', error)
    return { success: false, message: 'Gagal memperbarui item. Coba lagi.' }
  }
}

export async function deleteBusinessItem(id: string) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  try {
    await db.businessItem.delete({ where: { id, villaId: user.villaId } })
    revalidatePath('/business')
    return { success: true }
  } catch (error) {
    console.error('deleteBusinessItem error:', error)
    return { success: false, message: 'Gagal menghapus item. Coba lagi.' }
  }
}
