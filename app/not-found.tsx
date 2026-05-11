import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
      <div className="text-6xl font-light text-neutral-200">404</div>
      <div className="text-center">
        <h2 className="text-lg font-medium text-neutral-700 mb-1">
          Halaman tidak ditemukan
        </h2>
        <p className="text-sm text-neutral-400">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">
          <Home className="w-4 h-4 mr-2" />
          Kembali ke dashboard
        </Link>
      </Button>
    </div>
  )
}
