'use client'

import { useEffect } from 'react'
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
    <html lang="id">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-medium text-neutral-800 mb-1">Terjadi kesalahan</h2>
            <p className="text-sm text-neutral-500 max-w-sm">
              Aplikasi mengalami error tak terduga. Coba refresh halaman.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => (window.location.href = '/dashboard')}
              className="px-4 py-2 text-sm border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50"
            >
              Kembali ke dashboard
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 text-sm bg-neutral-800 text-white rounded-lg hover:bg-neutral-700"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
