'use client'

import { useState, useTransition, useCallback } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2, ExternalLink, RefreshCw, UploadCloud, CalendarCheck,
  Settings, ChevronDown, ChevronUp, XCircle, BedDouble, Tag, TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  pushAllRatesNow, pushAllAvailabilityNow, runInitialSync, deactivateChannex, getSyncDetails, changeCurrency, registerWebhook,
} from '@/app/actions/channex'

const CURRENCY_OPTIONS = [
  { value: 'IDR', label: 'IDR — Indonesian Rupiah' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'GBP', label: 'GBP — British Pound' },
]

interface ChannexStatus {
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

type SyncDetails = Awaited<ReturnType<typeof getSyncDetails>>

export function ChannexDashboard({ status, stats, userRole, onDisconnected }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [statsOverride, setStatsOverride] = useState<Partial<OtaStats> | null>(null)
  const [syncDetails, setSyncDetails] = useState<SyncDetails | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [showChangeCurrency, setShowChangeCurrency] = useState(false)
  const [newCurrency, setNewCurrency] = useState(status.currency ?? 'IDR')
  const [webhookId, setWebhookId] = useState(status.webhookId ?? null)
  const currentStats = statsOverride ? { ...stats, ...statsOverride } : stats
  const isOwner = userRole === 'OWNER' || userRole === 'SUPER_ADMIN'

  const fetchSyncDetails = useCallback(async () => {
    setSyncLoading(true)
    try {
      const data = await getSyncDetails()
      setSyncDetails(data)
    } finally {
      setSyncLoading(false)
    }
  }, [])

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
        await fetchSyncDetails()
      } else {
        toast.error(res.message ?? 'Sinkronisasi gagal')
      }
    })
  }

  function handleRegisterWebhook() {
    startTransition(async () => {
      const res = await registerWebhook(window.location.origin)
      if (res.success) {
        toast.success('Webhook berhasil didaftarkan')
        setWebhookId(res.webhookId ?? null)
      } else {
        toast.error(res.message ?? 'Gagal mendaftarkan webhook')
      }
    })
  }

  function handleChangeCurrencyConfirm() {
    startTransition(async () => {
      const res = await changeCurrency(newCurrency)
      if (res.success) {
        toast.success(`Mata uang diubah ke ${newCurrency}. Properti Channex baru telah dibuat.`)
        setShowChangeCurrency(false)
        setWebhookId(null)
        if (res.data) {
          setStatsOverride({ syncedRooms: res.data.roomTypes, activeRatePlans: res.data.ratePlans })
        }
        await fetchSyncDetails()
      } else {
        toast.error(res.message ?? 'Gagal mengganti mata uang')
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
            onClick={() => {
              const next = !showAdvanced
              setShowAdvanced(next)
              if (next && !syncDetails) fetchSyncDetails()
            }}
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
              {/* Currency section */}
              <div className="rounded-lg border border-border px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Mata Uang Properti</p>
                  <p className="text-sm font-semibold">{status.currency ?? 'IDR'}</p>
                </div>
                {!showChangeCurrency && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => { setNewCurrency(status.currency ?? 'IDR'); setShowChangeCurrency(true) }}
                  >
                    Ganti Currency
                  </Button>
                )}
              </div>

              {showChangeCurrency && (
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <p className="text-xs font-medium">Ganti Mata Uang</p>
                  <p className="text-xs text-destructive">
                    Mengganti mata uang akan menghapus property Channex saat ini dan membuat yang baru.
                    Semua sinkronisasi akan diulang dari awal.
                  </p>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {CURRENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPending || newCurrency === (status.currency ?? 'IDR')}
                      onClick={handleChangeCurrencyConfirm}
                      className="bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
                    >
                      {isPending ? 'Memproses...' : 'Konfirmasi Ganti'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setShowChangeCurrency(false)}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}

              {/* Sync status tables */}
              {syncLoading && (
                <p className="text-xs text-muted-foreground animate-pulse">Memuat status sinkronisasi…</p>
              )}
              {syncDetails && !syncLoading && (
                <div className="space-y-4">
                  {/* Rooms table */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Kamar</p>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kode · Nama</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Channex ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {syncDetails.rooms.map((r) => (
                            <tr key={r.id}>
                              <td className="px-3 py-2 font-medium">
                                <span className="font-mono text-muted-foreground mr-1">{r.code}</span>
                                {r.name}
                              </td>
                              <td className="px-3 py-2">
                                {r.channexId
                                  ? <span className="text-green-600 dark:text-green-400 font-medium">✓ Tersinkron</span>
                                  : <span className="text-muted-foreground">✗ Belum</span>
                                }
                              </td>
                              <td className="px-3 py-2 font-mono text-muted-foreground">
                                {r.channexId ? r.channexId.slice(0, 8) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Rate plans table */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Rate Plan</p>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nama</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kamar</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {syncDetails.ratePlans.map((rp) => (
                            <tr key={rp.id} className={cn(!rp.isActive && 'opacity-50')}>
                              <td className="px-3 py-2 font-medium">{rp.name}</td>
                              <td className="px-3 py-2 text-muted-foreground">{rp.roomName}</td>
                              <td className="px-3 py-2">
                                {rp.channexId
                                  ? <span className="text-green-600 dark:text-green-400 font-medium">✓ Tersinkron</span>
                                  : <span className="text-muted-foreground">✗ Belum</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

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
                <p className="text-xs font-medium mb-1.5">Webhook</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-xs text-muted-foreground flex-1">
                    {webhookId
                      ? <>✓ Terdaftar — <span className="font-mono">{webhookId.slice(0, 8)}</span></>
                      : 'Belum terdaftar. Diperlukan untuk menerima booking dari OTA.'}
                  </p>
                  <Button onClick={handleRegisterWebhook} disabled={isPending} variant="outline" size="sm">
                    {webhookId ? 'Daftarkan Ulang' : 'Daftarkan Webhook'}
                  </Button>
                </div>
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
