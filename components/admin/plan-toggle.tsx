'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface VillaData {
  id: string
  name: string
  slug: string | null
  email: string | null
  ownerName: string | null
  plan: string
  status: string
  createdAt: string
}

interface PlanToggleProps {
  villa: VillaData
}

export function PlanToggle({ villa }: PlanToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<string | null>(null)
  const plan = pendingPlan && pendingPlan !== villa.plan ? pendingPlan : villa.plan

  async function togglePlan() {
    const newPlan = plan === 'PRO' ? 'FREE' : 'PRO'
    setLoading(true)

    const supabase = createClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token

    if (!token) {
      toast.error('Session expired. Please login again.')
      setLoading(false)
      return
    }

    const res = await fetch('/admin/api/villa-plan', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ villaId: villa.id, plan: newPlan }),
    })

    if (!res.ok) {
      toast.error('Failed to update plan.')
      setLoading(false)
      return
    }

    setPendingPlan(newPlan)
    setLoading(false)
    toast.success(`${villa.name} is now ${newPlan}`)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={plan === 'PRO' ? 'default' : 'outline'}
        size="sm"
        className={
          plan === 'PRO'
            ? 'h-7 bg-primary px-2.5 text-xs hover:bg-primary-hover'
            : 'h-7 px-2.5 text-xs'
        }
        onClick={togglePlan}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : plan === 'PRO' ? (
          'PRO'
        ) : (
          'FREE'
        )}
      </Button>
      {loading ? null : (
        <span className="text-[10px] text-muted-foreground">click to toggle</span>
      )}
    </div>
  )
}
