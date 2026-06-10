'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { logActivity } from '@/lib/activity-log'

// --- Petty Cash ---

const PettyCashSchema = z.object({
  description: z.string().min(1),
  type: z.enum(['IN', 'OUT']),
  amount: z.number().positive(),
  note: z.string().optional(),
  date: z.string(),
})

export async function createPettyCash(data: z.infer<typeof PettyCashSchema>) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  const parsed = PettyCashSchema.parse(data)

  await db.pettyCash.create({
    data: {
      description: parsed.description,
      type: parsed.type,
      amount: parsed.amount,
      note: parsed.note,
      date: new Date(parsed.date),
      villaId: user.villaId!,
    },
  })

  await logActivity({
    villaId: user.villaId!,
    staffName: user.name,
    action: `Tambah petty cash ${parsed.type} Rp ${parsed.amount.toLocaleString('id-ID')}`,
    module: 'Finance',
  })

  revalidatePath('/finance')
  return { success: true }
}

export async function deletePettyCash(id: string) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  await db.pettyCash.delete({ where: { id, villaId: user.villaId! } })

  await logActivity({
    villaId: user.villaId!,
    staffName: user.name,
    action: 'Hapus petty cash',
    module: 'Finance',
  })

  revalidatePath('/finance')
  return { success: true }
}

// --- Payroll ---

const PayrollSchema = z.object({
  staffId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  amount: z.number().positive(),
  note: z.string().optional(),
})

export async function upsertPayroll(data: z.infer<typeof PayrollSchema>) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  const parsed = PayrollSchema.parse(data)

  await db.payroll.upsert({
    where: {
      staffId_month_year: {
        staffId: parsed.staffId,
        month: parsed.month,
        year: parsed.year,
      },
    },
    create: {
      staffId: parsed.staffId,
      month: parsed.month,
      year: parsed.year,
      amount: parsed.amount,
      note: parsed.note,
      villaId: user.villaId!,
    },
    update: {
      amount: parsed.amount,
      note: parsed.note,
    },
  })

  await logActivity({
    villaId: user.villaId!,
    staffName: user.name,
    action: `Input payroll bulan ${parsed.month}/${parsed.year}`,
    module: 'Finance',
  })

  revalidatePath('/finance')
  return { success: true }
}

export async function markPayrollPaid(id: string) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  await db.payroll.update({
    where: { id, villaId: user.villaId! },
    data: { status: 'PAID', paidAt: new Date() },
  })

  await logActivity({
    villaId: user.villaId!,
    staffName: user.name,
    action: 'Mark payroll PAID',
    module: 'Finance',
  })

  revalidatePath('/finance')
  return { success: true }
}

export async function markPayrollUnpaid(id: string) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  await db.payroll.update({
    where: { id, villaId: user.villaId! },
    data: { status: 'UNPAID', paidAt: null },
  })

  revalidatePath('/finance')
  return { success: true }
}

// --- Budget ---

const BudgetSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number(),
  target: z.number().positive(),
})

export async function upsertBudget(data: z.infer<typeof BudgetSchema>) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  const parsed = BudgetSchema.parse(data)

  await db.budget.upsert({
    where: {
      villaId_month_year: {
        villaId: user.villaId!,
        month: parsed.month,
        year: parsed.year,
      },
    },
    create: {
      month: parsed.month,
      year: parsed.year,
      target: parsed.target,
      villaId: user.villaId!,
    },
    update: { target: parsed.target },
  })

  await logActivity({
    villaId: user.villaId!,
    staffName: user.name,
    action: `Set budget target ${parsed.month}/${parsed.year}`,
    module: 'Finance',
  })

  revalidatePath('/finance')
  return { success: true }
}
