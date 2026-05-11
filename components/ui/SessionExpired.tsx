'use client'

import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SessionExpired() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
        <LogIn className="w-6 h-6 text-neutral-400" />
      </div>
      <div className="text-center">
        <h2 className="text-base font-medium text-neutral-700 mb-1">Sesi kamu telah berakhir</h2>
        <p className="text-sm text-neutral-400">Silakan login ulang untuk melanjutkan.</p>
      </div>
      <Button size="sm" onClick={() => (window.location.href = '/login')}>
        Login ulang
      </Button>
    </div>
  )
}
