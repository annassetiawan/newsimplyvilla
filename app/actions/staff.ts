'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { getVillaPlan } from '@/lib/subscription'

async function findSupabaseUserIdByEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any,
  email: string
): Promise<string | null> {
  // Supabase listUsers is paginated — for small teams this is fine
  const { data } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  return data?.users?.find((u: { id: string; email?: string }) => u.email === email)?.id ?? null
}

async function getSessionVillaId() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  return user.villaId!
}

export async function createStaff(data: {
  name: string
  email: string
  position: string
  role: 'OWNER' | 'STAFF'
  permissions: string[]
}) {
  const villaId = await getSessionVillaId()

  const plan = await getVillaPlan()
  if (plan === 'FREE') {
    const staffCount = await db.staff.count({ where: { villaId, isActive: true } })
    if (staffCount >= 2) {
      return { success: false, message: 'Paket Free hanya mendukung maksimal 2 akun staff. Upgrade ke Pro untuk menambah lebih banyak.' }
    }
  }

  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const staff = await db.staff.create({
      data: {
        villaId,
        name: data.name,
        email: data.email,
        position: data.position,
        role: data.role,
        isActive: true,
        permissions: data.role === 'OWNER' ? [] : data.permissions,
      },
    })
    // Invite via Supabase and store the returned user ID immediately
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(data.email, {
      data: { name: data.name },
    })
    after(() => console.log('[createStaff] invite result:', { userId: inviteData?.user?.id, error: inviteError }))
    if (inviteData?.user?.id) {
      await db.staff.update({
        where: { id: staff.id },
        data: { supabaseUserId: inviteData.user.id },
      })
    }
    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    console.error('createStaff error:', error)
    return { success: false, message: 'Gagal menambah staff. Coba lagi.' }
  }
}

export async function updateStaff(
  id: string,
  data: {
    name: string
    email: string
    position: string
    role: 'OWNER' | 'STAFF'
    isActive: boolean
    permissions: string[]
  }
) {
  await getSessionVillaId()
  try {
    await db.staff.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        position: data.position,
        role: data.role,
        isActive: data.isActive,
        permissions: data.role === 'OWNER' ? [] : data.permissions,
      },
    })
    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    console.error('updateStaff error:', error)
    return { success: false, message: 'Gagal memperbarui staff. Coba lagi.' }
  }
}

export async function toggleStaffActive(id: string, isActive: boolean) {
  await getSessionVillaId()
  try {
    await db.staff.update({ where: { id }, data: { isActive } })
    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    console.error('toggleStaffActive error:', error)
    return { success: false, message: 'Gagal memperbarui status staff. Coba lagi.' }
  }
}

export async function resendInvite(id: string) {
  await getSessionVillaId()
  try {
    const staff = await db.staff.findUnique({ where: { id } })
    if (!staff?.email) return { success: false, message: 'Email staf tidak ditemukan.' }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Find and delete existing Supabase auth user by ID or by email lookup
    const userIdToDelete = staff.supabaseUserId ?? await findSupabaseUserIdByEmail(adminClient, staff.email)
    after(() => console.log('[resendInvite] userIdToDelete:', userIdToDelete))
    if (userIdToDelete) {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userIdToDelete)
      after(() => console.log('[resendInvite] deleteUser result:', deleteError))
      if (!deleteError) {
        await db.staff.update({ where: { id }, data: { supabaseUserId: null } })
      }
    }

    const { data: inviteData, error } = await adminClient.auth.admin.inviteUserByEmail(staff.email, {
      data: { name: staff.name },
    })
    after(() => console.log('[resendInvite] inviteUserByEmail result:', { userId: inviteData?.user?.id, error }))
    if (error) throw error

    // Store new Supabase user ID
    if (inviteData?.user?.id) {
      await db.staff.update({ where: { id }, data: { supabaseUserId: inviteData.user.id } })
    }

    return { success: true }
  } catch (error) {
    console.error('resendInvite error:', error)
    return { success: false, message: 'Gagal mengirim ulang undangan. Coba lagi.' }
  }
}

export async function deleteStaff(id: string) {
  await getSessionVillaId()
  try {
    const staff = await db.staff.findUnique({ where: { id } })

    // If they have a Supabase account, delete it too
    if (staff?.supabaseUserId) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      await adminClient.auth.admin.deleteUser(staff.supabaseUserId)
    }

    await db.staff.delete({ where: { id } })
    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    console.error('deleteStaff error:', error)
    return { success: false, message: 'Gagal menghapus staf. Coba lagi.' }
  }
}

export async function resetStaffPassword(email: string) {
  await getSessionVillaId()
  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    // Use admin to generate a password reset link so it goes through our /auth/confirm
    const { error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
    })
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('resetStaffPassword error:', error)
    return { success: false, message: 'Gagal mengirim reset password. Coba lagi.' }
  }
}
