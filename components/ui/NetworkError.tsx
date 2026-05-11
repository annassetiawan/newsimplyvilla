'use client'

import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (countdown === 0) {
      onRetry?.()
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, onRetry])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
        <WifiOff className="w-6 h-6 text-neutral-400" />
      </div>
      <div className="text-center">
        <h2 className="text-base font-medium text-neutral-700 mb-1">Tidak ada koneksi</h2>
        <p className="text-sm text-neutral-400">Periksa koneksi internet kamu.</p>
      </div>
      <Button size="sm" onClick={() => { setCountdown(10); onRetry?.() }}>
        Coba lagi {countdown > 0 && `(${countdown})`}
      </Button>
    </div>
  )
}
