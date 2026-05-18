'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/hooks/useSubscription'

interface Props {
  feature: string
  description: string
  children: React.ReactNode
}

const DEV_FORCE_PRO = process.env.NEXT_PUBLIC_FORCE_PRO === 'true'

export function ProGate({ feature, description, children }: Props) {
  const { isPro, isLoading } = useSubscription()

  if (DEV_FORCE_PRO) return <>{children}</>

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isPro) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E1A62F22]">
          <Lock className="h-8 w-8 text-[#E1A62F]" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-xl font-bold">Fitur Pro</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{feature}</span> hanya tersedia di paket Pro
        </div>
        <Button asChild>
          <Link href="/pricing">Upgrade ke Pro</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
