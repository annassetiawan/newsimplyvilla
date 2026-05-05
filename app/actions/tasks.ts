'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

const VILLA_ID = 'villa-senja-ubud'

export async function createTask(data: {
  title: string
  type: 'MAINTENANCE' | 'CLEANING'
  location: string
  priority: 'HIGH' | 'MED' | 'LOW'
  assignedTo?: string
  dueDate?: Date
}) {
  await db.task.create({
    data: {
      title: data.title,
      type: data.type,
      location: data.location,
      priority: data.priority,
      assignedTo: data.assignedTo || null,
      dueDate: data.dueDate || null,
      status: 'PENDING',
      villaId: VILLA_ID,
    },
  })
  revalidatePath('/maintenance')
  revalidatePath('/dashboard')
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
  await db.task.update({ where: { id }, data })
  revalidatePath('/maintenance')
  revalidatePath('/dashboard')
}

export async function deleteTask(id: string) {
  await db.task.delete({ where: { id } })
  revalidatePath('/maintenance')
  revalidatePath('/dashboard')
}

export async function advanceStatus(id: string, current: string) {
  const next = current === 'PENDING' ? 'IN_PROGRESS' : 'DONE'
  await db.task.update({ where: { id }, data: { status: next } })
  revalidatePath('/maintenance')
  revalidatePath('/dashboard')
}
