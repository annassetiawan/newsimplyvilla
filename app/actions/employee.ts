'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'

const EmployeeSchema = z.object({
  name: z.string().min(1),
  photo: z.url().optional().or(z.literal('')),
  idNumber: z.string().optional(),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  position: z.string().min(1),
  department: z.string().optional(),
  employmentType: z.enum(['PERMANENT', 'CONTRACT', 'FREELANCE']),
  startDate: z.string(),
  endDate: z.string().optional(),
  baseSalary: z.number().positive().optional(),
  staffId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export async function createEmployee(data: z.infer<typeof EmployeeSchema>) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  const parsed = EmployeeSchema.parse(data)

  const employee = await db.employee.create({
    data: {
      name: parsed.name,
      photo: parsed.photo || null,
      idNumber: parsed.idNumber || null,
      birthPlace: parsed.birthPlace || null,
      birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
      gender: parsed.gender || null,
      phone: parsed.phone || null,
      address: parsed.address || null,
      position: parsed.position,
      department: parsed.department || null,
      employmentType: parsed.employmentType,
      startDate: new Date(parsed.startDate),
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      baseSalary: parsed.baseSalary || null,
      staffId: parsed.staffId || null,
      status: parsed.status,
      villaId: user.villaId!,
    },
  })

  await db.leaveAllocation.create({
    data: {
      employeeId: employee.id,
      year: new Date().getFullYear(),
      totalDays: 12,
      usedDays: 0,
      villaId: user.villaId!,
    },
  })

  revalidatePath('/employee')
  return { success: true }
}

export async function updateEmployee(id: string, data: z.infer<typeof EmployeeSchema>) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  const parsed = EmployeeSchema.parse(data)

  await db.employee.update({
    where: { id, villaId: user.villaId! },
    data: {
      name: parsed.name,
      photo: parsed.photo || null,
      idNumber: parsed.idNumber || null,
      birthPlace: parsed.birthPlace || null,
      birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
      gender: parsed.gender || null,
      phone: parsed.phone || null,
      address: parsed.address || null,
      position: parsed.position,
      department: parsed.department || null,
      employmentType: parsed.employmentType,
      startDate: new Date(parsed.startDate),
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      baseSalary: parsed.baseSalary || null,
      staffId: parsed.staffId || null,
      status: parsed.status,
    },
  })

  revalidatePath('/employee')
  return { success: true }
}

export async function deactivateEmployee(id: string) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  await db.employee.update({
    where: { id, villaId: user.villaId! },
    data: { status: 'INACTIVE' },
  })

  revalidatePath('/employee')
  return { success: true }
}
