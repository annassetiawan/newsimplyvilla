'use client'

import { useEffect, useState } from 'react'

export type Plan = 'FREE' | 'PRO'
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'TRIAL'

interface SubscriptionData {
  plan: Plan
  status: SubscriptionStatus
  startDate: string | null
  endDate: string | null
}

interface UseSubscriptionResult {
  plan: Plan
  status: SubscriptionStatus
  isPro: boolean
  isLoading: boolean
}

export function useSubscription(): UseSubscriptionResult {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    fetch('/api/subscription')
      .then((res) => res.json())
      .then((json: SubscriptionData) => {
        if (!ignore) setData(json)
      })
      .catch(() => {
        if (!ignore) setData({ plan: 'FREE', status: 'INACTIVE', startDate: null, endDate: null })
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  const plan = data?.plan ?? 'FREE'
  const status = data?.status ?? 'INACTIVE'

  return {
    plan,
    status,
    isPro: plan === 'PRO' && status === 'ACTIVE',
    isLoading,
  }
}
