import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function getSessionUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const staff = await db.staff.findUnique({
    where: { supabaseUserId: user.id },
    include: { villa: { include: { subscription: true } } },
  })
  return staff
}
