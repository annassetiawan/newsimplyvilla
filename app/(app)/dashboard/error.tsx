'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LayoutDashboard } from 'lucide-react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
        <LayoutDashboard className="w-6 h-6 text-neutral-400" />
      </div>
      <div className="text-center">
        <h2 className="text-base font-medium text-neutral-700 mb-1">Dashboard tidak bisa dimuat.</h2>
        <p className="text-sm text-neutral-400">Coba refresh halaman atau hubungi admin jika masalah berlanjut.</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={() => (window.location.href = '/dashboard')}>
          Dashboard
        </Button>
        <Button size="sm" onClick={() => reset()}>Coba lagi</Button>
      </div>
    </div>
  )
}
