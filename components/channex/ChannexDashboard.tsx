'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2, ExternalLink, RefreshCw, UploadCloud, CalendarCheck,
  Settings, ChevronDown, ChevronUp, XCircle, BedDouble, Tag, TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  pushAllRatesNow, pushAllAvailabilityNow, runInitialSync, deactivateChannex,
} from '@/app/actions/channex'

interface ChannexStatus {
  connected: boolean
  isActive?: boolean
  environment?: 'staging' | 'production'
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
  status: ChannexStatus
  stats: OtaStats
  userRole: 'OWNER' | 'STAFF' | 'SUPER_ADMIN'
  onDisconnected: () => void
}

const OTA_LIST = [
  { name: 'Booking.com', logo: '🏨' },
  { name: 'Airbnb', logo: '🏠' },
  { name: 'Traveloka', logo: '✈️' },
  { name: 'Agoda', logo: '🌏' },
  { name: 'Expedia', logo: '🌐' },
]

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export function ChannexDashboard({ status, stats, userRole, onDisconnected }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [statsOverride, setStatsOverride] = useState<Partial<OtaStats> | null>(null)
  const currentStats = statsOverride ? { ...stats, ...statsOverride } : stats
  const isOwner = userRole === 'OWNER' || userRole === 'SUPER_ADMIN'

  const channexUrl = status.environment === 'staging'
    ? 'https://staging.channex.io'
    : 'https://app.channex.io'

  function handlePushRates() {
    startTransition(async () => {
      const res = await pushAllRatesNow()
      if (res.success) toast.success(res.message ?? 'Rate berhasil diperbarui')
      else toast.error(res.message ?? 'Gagal memperbarui rate')
    })
  }

  function handlePushAvailability() {
    startTransition(async () => {
      const res = await pushAllAvailabilityNow()
      if (res.success) toast.success(res.message ?? 'Ketersediaan berhasil diperbarui')
      else toast.error(res.message ?? 'Gagal memperbarui ketersediaan')
    })
  }

  function handleResync() {
    startTransition(async () => {
      const res = await runInitialSync()
      if (res.success && res.data) {
        toast.success(`Sinkronisasi selesai`)
        setStatsOverride({ syncedRooms: res.data!.roomTypes, activeRatePlans: res.data!.ratePlans })
      } else {
        toast.error(res.message ?? 'Sinkronisasi gagal')
      }
    })
  }

  function handleDisconnect() {
    startTransition(async () => {
      await deactivateChannex()
      toast.success('Channel manager dinonaktifkan')
      onDisconnected()
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Status bar */}
      <div className={cn(
        'flex items-center gap-4 rounded-xl border p-4',
        status.isActive
          ? 'border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10'
          : 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10'
      )}>
        {status.isActive
          ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          : <XCircle className="h-5 w-5 shrink-0 text-red-500" />
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {status.isActive ? 'Channel Manager Aktif' : 'Channel Manager Tidak Aktif'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {status.environment === 'staging' ? 'Mode Testing' : 'Mode Produksi'}
            {status.lastSyncAt && ` · Sync terakhir: ${fmtDate(status.lastSyncAt)}`}
          </p>
        </div>
        <a
          href={channexUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors shrink-0"
        >
          Buka Channex <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, label: 'Booking OTA bulan ini', value: currentStats.bookingsThisMonth },
          { icon: BedDouble, label: 'Kamar tersinkron', value: currentStats.syncedRooms },
          { icon: Tag, label: 'Rate plan aktif', value: currentStats.activeRatePlans },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon className="h-4 w-4" />
              <span className="text-xs">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* OTA Channels */}
      <div className="rounded-xl border border-border bg-background p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Saluran OTA</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hubungkan OTA dari dashboard Channex. Booking akan masuk otomatis ke SimplyVilla.
            </p>
          </div>
          <a
            href={`${channexUrl}/applications`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              + Tambah OTA <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        </div>

        <div className="divide-y divide-border">
          {OTA_LIST.map((ota) => (
            <div key={ota.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">{ota.logo}</span>
                <span className="text-sm font-medium">{ota.name}</span>
              </div>
              <a
                href={`${channexUrl}/applications`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Atur di Channex <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced (owner only) */}
      {isOwner && (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <button type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Pengaturan Teknis
            </div>
            {showAdvanced
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </button>

          {showAdvanced && (
            <div className="border-t border-border px-5 py-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Gunakan tombol di bawah jika data di Channex tidak sesuai dengan SimplyVilla.
                Biasanya tidak perlu dijalankan manual.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleResync} disabled={isPending} variant="outline" size="sm" className="gap-1.5">
                  <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
                  Sinkronisasi Ulang
                </Button>
                <Button onClick={handlePushRates} disabled={isPending} variant="outline" size="sm" className="gap-1.5">
                  <UploadCloud className="h-3.5 w-3.5" />
                  Perbarui Harga
                </Button>
                <Button onClick={handlePushAvailability} disabled={isPending} variant="outline" size="sm" className="gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Perbarui Ketersediaan
                </Button>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Zona Berbahaya</p>
                <Button
                  onClick={handleDisconnect}
                  disabled={isPending}
                  variant="outline"
                  size="sm"
                  className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                >
                  Putuskan Koneksi Channex
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
