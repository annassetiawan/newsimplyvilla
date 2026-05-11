import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export const getSessionUser = cache(async function getSessionUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  let staff = await db.staff.findUnique({
    where: { supabaseUserId: user.id },
    include: { villa: { include: { subscription: true } } },
  })

  // Invited staff: supabaseUserId is null until first login — link it by email
  if (!staff && user.email) {
    const byEmail = await db.staff.findUnique({
      where: { email: user.email },
      include: { villa: { include: { subscription: true } } },
    })
    if (byEmail && !byEmail.supabaseUserId) {
      staff = await db.staff.update({
        where: { id: byEmail.id },
        data: { supabaseUserId: user.id },
        include: { villa: { include: { subscription: true } } },
      })
    }
  }

  return staff
})
