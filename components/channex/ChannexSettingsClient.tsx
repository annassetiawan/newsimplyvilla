'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, RefreshCw, ExternalLink, Eye, EyeOff, Webhook, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { saveChannexConfig, runInitialSync, registerWebhook, pushAllRatesNow } from '@/app/actions/channex'

type ChannexStatus = {
  connected: boolean
  isActive?: boolean
  environment?: 'staging' | 'production'
  channexPropertyId?: string | null
  webhookId?: string | null
  lastSyncAt?: string | null
  syncedRooms?: number
  syncedRatePlans?: number
}

interface Props {
  initialStatus: ChannexStatus
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export function ChannexSettingsClient({ initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [environment, setEnvironment] = useState<'staging' | 'production'>(
    initialStatus.environment ?? 'staging'
  )
  const [isPending, startTransition] = useTransition()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey.trim()) { toast.error('API Key wajib diisi'); return }
    startTransition(async () => {
      const res = await saveChannexConfig({ apiKey: apiKey.trim(), environment })
      if (res.success) {
        toast.success('Koneksi berhasil! Channex terhubung.')
        setApiKey('')
        setStatus((s) => ({ ...s, connected: true, isActive: true, environment }))
      } else {
        toast.error(res.message ?? 'Koneksi gagal')
      }
    })
  }

  function handleSync() {
    startTransition(async () => {
      const res = await runInitialSync()
      if (res.success && res.data) {
        toast.success(`Sync selesai: ${res.data.roomTypes} room type, ${res.data.ratePlans} rate plan`)
        setStatus((s) => ({ ...s, syncedRooms: res.data!.roomTypes, syncedRatePlans: res.data!.ratePlans, lastSyncAt: new Date().toISOString() }))
      } else {
        toast.error(res.message ?? 'Sync gagal')
      }
    })
  }

  function handlePushRates() {
    startTransition(async () => {
      const res = await pushAllRatesNow()
      if (res.success) {
        toast.success(res.message ?? 'Rate berhasil di-push ke Channex')
      } else {
        toast.error(res.message ?? 'Push rates gagal')
      }
    })
  }

  function handleRegisterWebhook() {
    const appUrl = window.location.origin
    startTransition(async () => {
      const res = await registerWebhook(appUrl)
      if (res.success) {
        toast.success('Webhook berhasil didaftarkan!')
        setStatus((s) => ({ ...s, webhookId: res.webhookId }))
      } else {
        toast.error(res.message ?? 'Gagal mendaftarkan webhook')
      }
    })
  }

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/channex/webhook`
    : '/api/channex/webhook'

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Connection Status */}
      <div className={cn(
        'flex items-center gap-3 rounded-xl border p-4',
        status.connected && status.isActive
          ? 'border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10'
          : 'border-border bg-background'
      )}>
        {status.connected && status.isActive ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {status.connected && status.isActive ? 'Terhubung ke Channex' : 'Belum terhubung'}
          </p>
          {status.connected && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {status.environment === 'staging' ? 'Staging' : 'Production'}
              {status.channexPropertyId && ` · Property ID: ${status.channexPropertyId}`}
            </p>
          )}
        </div>
        {status.connected && (
          <a
            href={status.environment === 'staging' ? 'https://staging.channex.io' : 'https://app.channex.io'}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Buka Channex <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* API Key Form */}
      <div className="rounded-xl border border-border bg-background p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Konfigurasi API</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dapatkan API key dari Channex dashboard → User Settings → API Keys.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Environment</Label>
            <div className="flex gap-2">
              {(['staging', 'production'] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setEnvironment(env)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium border transition-colors',
                    environment === env
                      ? 'bg-neutral-800 text-white border-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 dark:border-neutral-200'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {env === 'staging' ? 'Staging (Testing)' : 'Production'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="channex-api-key">
              API Key
              {status.connected && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">(kosongkan jika tidak ingin mengubah)</span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="channex-api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={status.connected ? '••••••••••••••••' : 'Masukkan Channex API Key'}
                className="pr-10 font-mono text-sm"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending || (!apiKey.trim() && !status.connected)}
            className="bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900"
          >
            {isPending ? 'Menyimpan & Menguji...' : status.connected ? 'Perbarui Koneksi' : 'Simpan & Test Koneksi'}
          </Button>
        </form>
      </div>

      {/* Sync Panel */}
      {status.connected && status.isActive && (
        <div className="rounded-xl border border-border bg-background p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Sinkronisasi Data</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sync semua room type dan rate plan ke Channex. Aman dijalankan berulang kali.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Room Types', value: status.syncedRooms ?? 0 },
              { label: 'Rate Plans', value: status.syncedRatePlans ?? 0 },
              { label: 'Last Sync', value: fmtDate(status.lastSyncAt) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleSync} disabled={isPending} variant="outline" className="gap-2">
              <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
              {isPending ? 'Sync berjalan...' : 'Jalankan Initial Sync'}
            </Button>
            <Button onClick={handlePushRates} disabled={isPending} variant="outline" className="gap-2">
              <UploadCloud className={cn('h-4 w-4', isPending && 'animate-pulse')} />
              {isPending ? 'Pushing...' : 'Push Rates ke Channex'}
            </Button>
          </div>
        </div>
      )}

      {/* Webhook Panel */}
      {status.connected && status.isActive && (
        <div className="rounded-xl border border-border bg-background p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Webhook</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Terima booking OTA secara real-time dari Channex.
              </p>
            </div>
            {status.webhookId && (
              <span className="flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400 shrink-0">
                <CheckCircle2 className="h-3 w-3" /> Terdaftar
              </span>
            )}
          </div>

          {/* Webhook URL display */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Callback URL:</p>
            <code className="block rounded-md bg-muted px-3 py-2 text-xs font-mono break-all">
              {webhookUrl}
            </code>
          </div>

          {status.webhookId ? (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Webhook ID: <span className="font-mono">{status.webhookId}</span>
            </div>
          ) : (
            <Button
              onClick={handleRegisterWebhook}
              disabled={isPending}
              variant="outline"
              className="gap-2"
            >
              <Webhook className={cn('h-4 w-4', isPending && 'animate-pulse')} />
              {isPending ? 'Mendaftarkan...' : 'Daftarkan Webhook Otomatis'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
