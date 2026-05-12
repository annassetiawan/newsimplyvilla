import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

const getCachedStaff = unstable_cache(
  async (supabaseUserId: string) =>
    db.staff.findUnique({
      where: { supabaseUserId },
      include: { villa: { include: { subscription: true } } },
    }),
  ['staff-session'],
  { revalidate: 60 }
)

const linkAndGetStaff = async (email: string, supabaseUserId: string) => {
  const byEmail = await db.staff.findUnique({
    where: { email },
    include: { villa: { include: { subscription: true } } },
  })
  if (byEmail && !byEmail.supabaseUserId) {
    return db.staff.update({
      where: { id: byEmail.id },
      data: { supabaseUserId },
      include: { villa: { include: { subscription: true } } },
    })
  }
  return null
}

export const getSessionUser = cache(async function getSessionUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  let staff = await getCachedStaff(user.id)

  // Invited staff: supabaseUserId is null until first login — link it by email
  if (!staff && user.email) {
    staff = await linkAndGetStaff(user.email, user.id)
  }

  return staff
})
