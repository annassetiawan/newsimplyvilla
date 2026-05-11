'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-medium text-neutral-800 mb-1">
          Terjadi kesalahan
        </h2>
        <p className="text-sm text-neutral-500 max-w-sm">
          Halaman tidak bisa dimuat. Coba refresh atau kembali ke dashboard.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
          Kembali ke dashboard
        </Button>
        <Button onClick={() => reset()}>Coba lagi</Button>
      </div>
    </div>
  )
}
