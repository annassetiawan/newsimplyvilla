'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Circle, Eye, EyeOff, Loader2, Plug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { saveChannexConfig, runInitialSync, registerWebhook } from '@/app/actions/channex'

type Step = 'connect' | 'syncing' | 'done'

interface SyncProgress {
  property: boolean
  rooms: boolean
  ratePlans: boolean
  webhook: boolean
}

interface Props {
  onConnected: () => void
}

const SYNC_ITEMS: Array<{ key: keyof SyncProgress; label: string }> = [
  { key: 'property', label: 'Data properti tersinkron' },
  { key: 'rooms', label: 'Tipe kamar tersinkron' },
  { key: 'ratePlans', label: 'Rate plan tersinkron' },
  { key: 'webhook', label: 'Notifikasi booking aktif' },
]

export function ChannexSetupWizard({ onConnected }: Props) {
  const [step, setStep] = useState<Step>('connect')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [environment, setEnvironment] = useState<'staging' | 'production'>('staging')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<SyncProgress>({ property: false, rooms: false, ratePlans: false, webhook: false })

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey.trim()) { toast.error('Masukkan kode API Channex'); return }

    setIsLoading(true)
    setStep('syncing')

    try {
      // Step 1: save config + test connection
      const saveRes = await saveChannexConfig({ apiKey: apiKey.trim(), environment })
      if (!saveRes.success) {
        toast.error(saveRes.message ?? 'Koneksi gagal — periksa kode API')
        setStep('connect')
        setIsLoading(false)
        return
      }

      // Step 2: initial sync (property → rooms → rate plans)
      const syncRes = await runInitialSync()
      if (syncRes.success) {
        setProgress((p) => ({ ...p, property: true, rooms: true, ratePlans: true }))
      } else {
        toast.error(syncRes.message ?? 'Sinkronisasi gagal')
        setStep('connect')
        setIsLoading(false)
        return
      }

      // Step 3: register webhook
      const origin = window.location.origin
      const webhookRes = await registerWebhook(origin)
      if (webhookRes.success) {
        setProgress((p) => ({ ...p, webhook: true }))
      }
      // Webhook failure is non-fatal — continue anyway

      setStep('done')
    } catch {
      toast.error('Terjadi kesalahan, coba lagi')
      setStep('connect')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center gap-0 mb-8">
        {(['connect', 'syncing', 'done'] as Step[]).map((s, i) => {
          const isActive = step === s
          const isDone = (step === 'syncing' && s === 'connect') || (step === 'done' && s !== 'done')
          const label = ['Hubungkan', 'Sinkronisasi', 'Selesai'][i]
          return (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  isDone ? 'bg-green-600 text-white' :
                  isActive ? 'bg-primary text-white' :
                  'bg-muted text-muted-foreground'
                )}>
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn('text-xs', isActive ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className={cn('h-px flex-1 mx-2 mb-5', isDone ? 'bg-green-600' : 'bg-border')} />}
            </div>
          )
        })}
      </div>

      {/* Step: Connect */}
      {step === 'connect' && (
        <div className="rounded-xl border border-border bg-background p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Plug className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">Hubungkan ke Channex</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Channex adalah perantara antara SimplyVilla dan platform OTA (Booking.com, Airbnb, dll).
              Dapatkan kode API dari{' '}
              <a href="https://staging.channex.io" target="_blank" rel="noopener noreferrer"
                className="text-primary underline underline-offset-2">
                dashboard Channex
              </a>
              {' '}→ User Settings → API Keys.
            </p>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <div className="flex gap-2">
                {([['staging', 'Mode Testing'], ['production', 'Mode Produksi']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setEnvironment(val)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-medium border transition-colors',
                      environment === val
                        ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {environment === 'staging' && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Mode Testing: untuk uji coba. Gunakan Mode Produksi saat siap go-live.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="channex-apikey">Kode API Channex</Label>
              <div className="relative">
                <Input
                  id="channex-apikey"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Tempel kode API di sini..."
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

            <Button type="submit" disabled={isLoading} className="w-full bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghubungkan...</> : 'Hubungkan'}
            </Button>
          </form>
        </div>
      )}

      {/* Step: Syncing */}
      {step === 'syncing' && (
        <div className="rounded-xl border border-border bg-background p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold mb-1">Menyinkronkan data...</h2>
            <p className="text-sm text-muted-foreground">Harap tunggu, ini hanya berlangsung beberapa detik.</p>
          </div>
          <div className="space-y-3">
            {SYNC_ITEMS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                {progress[key] ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />
                )}
                <span className={cn('text-sm', progress[key] ? 'text-foreground' : 'text-muted-foreground')}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10 p-6 space-y-5 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-300">Channel Manager Aktif!</h2>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              SimplyVilla sudah terhubung ke Channex. Sekarang hubungkan OTA dari dashboard Channex.
            </p>
          </div>
          <div className="space-y-3 pt-1">
            {SYNC_ITEMS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-center gap-2">
                {progress[key]
                  ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                  : <Circle className="h-4 w-4 text-muted-foreground" />
                }
                <span className="text-sm text-green-700 dark:text-green-400">{label}</span>
              </div>
            ))}
          </div>
          <Button onClick={onConnected} className="w-full bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-500">
            Lihat Dashboard
          </Button>
        </div>
      )}
    </div>
  )
}
