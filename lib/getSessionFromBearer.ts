import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getSessionFromBearer(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const supabase = getSupabase()

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null

  const staff = await db.staff.findUnique({
    where: { supabaseUserId: data.user.id },
    include: { villa: { include: { subscription: true } } },
  })

  // Invited staff: supabaseUserId is null until first login — link it by email
  if (!staff && data.user.email) {
    const byEmail = await db.staff.findUnique({
      where: { email: data.user.email },
      include: { villa: { include: { subscription: true } } },
    })
    if (byEmail && !byEmail.supabaseUserId) {
      return db.staff.update({
        where: { id: byEmail.id },
        data: { supabaseUserId: data.user.id },
        include: { villa: { include: { subscription: true } } },
      })
    }
  }

  return staff
}
