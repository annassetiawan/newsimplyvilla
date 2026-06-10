'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { logActivity } from '@/lib/activity-log'

export async function createTask(data: {
  title: string
  type: 'MAINTENANCE' | 'CLEANING'
  location: string
  priority: 'HIGH' | 'MED' | 'LOW'
  assignedTo?: string
  dueDate?: Date
}) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    await db.task.create({
      data: {
        title: data.title,
        type: data.type,
        location: data.location,
        priority: data.priority,
        assignedTo: data.assignedTo || null,
        dueDate: data.dueDate || null,
        status: 'PENDING',
        villaId: user.villaId!,
      },
    })
    await logActivity({ villaId: user.villaId!, staffName: user.name, action: `Added task: ${data.title}`, module: 'Maintenance' })
    revalidatePath('/maintenance')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('createTask error:', error)
    return { success: false, message: 'Gagal membuat task. Coba lagi.' }
  }
}

export async function updateTask(
  id: string,
  data: {
    title?: string
    type?: 'MAINTENANCE' | 'CLEANING'
    location?: string
    priority?: 'HIGH' | 'MED' | 'LOW'
    assignedTo?: string | null
    dueDate?: Date | null
    status?: 'PENDING' | 'IN_PROGRESS' | 'DONE'
  }
) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    await db.task.update({ where: { id }, data })
    revalidatePath('/maintenance')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('updateTask error:', error)
    return { success: false, message: 'Gagal memperbarui task. Coba lagi.' }
  }
}

export async function deleteTask(id: string) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    await db.task.delete({ where: { id } })
    revalidatePath('/maintenance')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('deleteTask error:', error)
    return { success: false, message: 'Gagal menghapus task. Coba lagi.' }
  }
}

export async function advanceStatus(id: string, current: string) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    const next = current === 'PENDING' ? 'IN_PROGRESS' : 'DONE'
    await db.task.update({ where: { id }, data: { status: next } })
    revalidatePath('/maintenance')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('advanceStatus error:', error)
    return { success: false, message: 'Gagal memperbarui status. Coba lagi.' }
  }
}

export async function moveTaskStatus(id: string, status: 'PENDING' | 'IN_PROGRESS' | 'DONE') {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    await db.task.update({ where: { id }, data: { status } })
    revalidatePath('/maintenance')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('moveTaskStatus error:', error)
    return { success: false, message: 'Gagal memindahkan task. Coba lagi.' }
  }
}
