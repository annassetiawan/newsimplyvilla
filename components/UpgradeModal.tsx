'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Wallet,
  Users,
  UserCheck,
  Globe,
  GitBranch,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface FeatureContent {
  icon: LucideIcon
  title: string
  desc: string
  benefits: string[]
}

const FEATURE_CONTENT: Record<string, FeatureContent> = {
  Business: {
    icon: BarChart3,
    title: 'Analitik Bisnis Lanjutan',
    desc: 'Pantau performa villa secara mendalam dengan insight revenue, tren okupansi, dan rekomendasi harga otomatis.',
    benefits: [
      'Revenue analytics per kamar',
      'Tren okupansi bulanan & tahunan',
      'Rekomendasi harga dinamis',
      'Export laporan PDF',
    ],
  },
  'Finance & Account': {
    icon: Wallet,
    title: 'Finance & Account',
    desc: 'Kelola keuangan villa lebih profesional dengan laporan pajak, multi-akun bank, dan invoice otomatis ke tamu.',
    benefits: [
      'Laporan keuangan siap pajak',
      'Multi-akun bank',
      'Invoice otomatis ke tamu',
      'Rekonsiliasi transaksi',
    ],
  },
  'User Management': {
    icon: Users,
    title: 'User Management Lanjutan',
    desc: 'Atur akses tim dengan role kustom dan permission granular sesuai kebutuhan villa kamu.',
    benefits: [
      'Role & permission kustom',
      'Unlimited user accounts',
      'Login activity log',
      '2FA untuk semua user',
    ],
  },
  'Employee Management': {
    icon: UserCheck,
    title: 'Employee Management',
    desc: 'Kelola data karyawan, absensi, dan payroll dalam satu sistem terintegrasi.',
    benefits: [
      'Data karyawan lengkap',
      'Absensi & overtime tracking',
      'Perhitungan payroll otomatis',
      'Performance review',
    ],
  },
  'Channel Manager': {
    icon: Globe,
    title: 'Channel Manager',
    desc: 'Sinkronisasi ketersediaan kamar secara real-time ke Booking.com, Airbnb, Agoda, dan OTA lainnya.',
    benefits: [
      'Sync ke 10+ platform OTA',
      'Real-time availability update',
      'Cegah double booking otomatis',
      'Unified inbox pesan tamu',
    ],
  },
  'Change Management': {
    icon: GitBranch,
    title: 'Change Management',
    desc: 'Audit trail lengkap dan approval workflow untuk setiap perubahan data penting di sistem.',
    benefits: [
      'Audit trail semua perubahan',
      'Approval workflow',
      'Rollback data',
      'Notifikasi perubahan ke owner',
    ],
  },
}

const FALLBACK: FeatureContent = {
  icon: BarChart3,
  title: 'Fitur Pro',
  desc: 'Tingkatkan ke paket Pro untuk mengakses fitur ini.',
  benefits: ['Akses penuh ke semua fitur', 'Dukungan prioritas'],
}

interface Props {
  isOpen: boolean
  onClose: () => void
  feature: string
}

export function UpgradeModal({ isOpen, onClose, feature }: Props) {
  const router = useRouter()
  const content = FEATURE_CONTENT[feature] ?? FALLBACK
  const Icon = content.icon

  function handleUpgrade() {
    onClose()
    router.push('/pricing')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E1A62F22]">
              <Icon className="h-5 w-5 text-[#E1A62F]" />
            </div>
            <DialogTitle className="text-[15px] font-semibold leading-snug">
              {content.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-xs text-muted-foreground leading-relaxed">{content.desc}</p>

        <ul className="space-y-1.5">
          {content.benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold text-[10px]">
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-border pt-3 space-y-0.5">
          <p className="text-xl font-bold text-[#E1A62F]">Rp 299.000 / bulan</p>
          <p className="text-xs text-muted-foreground">
            atau Rp 2.990.000 / tahun{' '}
            <span className="text-green-600 font-medium">(hemat 2 bulan)</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button className="w-full" onClick={handleUpgrade}>
            Lihat Paket Pro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
