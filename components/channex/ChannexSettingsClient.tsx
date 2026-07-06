'use client'

import { useState } from 'react'
import { ChannexSetupWizard } from './ChannexSetupWizard'
import { ChannexDashboard } from './ChannexDashboard'
import { getOtaStats } from '@/app/actions/channex'

type ChannexStatus = {
  connected: boolean
  isActive?: boolean
  environment?: 'staging' | 'production'
  currency?: string
  channexPropertyId?: string | null
  webhookId?: string | null
  lastSyncAt?: string | null
  syncedRooms?: number
  syncedRatePlans?: number
}

interface OtaStats {
  bookingsThisMonth: number
  syncedRooms: number
  activeRatePlans: number
}

interface Props {
  initialStatus: ChannexStatus
  initialStats: OtaStats
  userRole: 'OWNER' | 'STAFF' | 'SUPER_ADMIN'
}

export function ChannexSettingsClient({ initialStatus, initialStats, userRole }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [stats, setStats] = useState(initialStats)

  const isConnected = status.connected && status.isActive

  async function handleConnected() {
    try {
      const fresh = await getOtaStats()
      setStats(fresh)
    } catch {}
    setStatus((s) => ({ ...s, connected: true, isActive: true }))
  }

  function handleDisconnected() {
    setStatus((s) => ({ ...s, isActive: false }))
  }

  if (!isConnected) {
    return <ChannexSetupWizard onConnected={handleConnected} />
  }

  return (
    <ChannexDashboard
      status={status}
      stats={stats}
      userRole={userRole}
      onDisconnected={handleDisconnected}
    />
  )
}
