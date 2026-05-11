'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useSubscription } from '@/hooks/useSubscription'
import { WaitlistModal } from '@/components/WaitlistModal'

type Billing = 'bulanan' | 'tahunan'

const FREE_FEATURES = [
  '1 properti villa',
  'Dashboard & laporan dasar',
  'Front Desk & reservasi manual',
  'Manajemen kamar & area',
  'Inventory management',
  'Maintenance & cleaning tasks',
  'Staff schedule',
  'SOP management',
  'Maksimal 2 user account',
]

const PRO_FEATURES = [
  { text: 'Semua fitur Free', star: false },
  { text: 'Business analytics lanjutan', star: true },
  { text: 'Finance & Account (invoice, pajak)', star: true },
  { text: 'User Management (role kustom, unlimited user)', star: true },
  { text: 'Employee Management (absensi, payroll)', star: true },
  { text: 'Channel Manager (Booking.com, Airbnb, Agoda)', star: true },
  { text: 'Priority support', star: true },
  { text: 'Unlimited user accounts', star: true },
]

const TABLE_ROWS: { label: string; free: string | boolean; pro: string | boolean; category?: string }[] = [
  { label: 'OPERASIONAL DASAR', free: '', pro: '', category: 'header' },
  { label: 'Dashboard & analytics', free: true, pro: true },
  { label: 'Front Desk & reservasi', free: true, pro: true },
  { label: 'Manajemen kamar & area', free: true, pro: true },
  { label: 'Inventory management', free: true, pro: true },
  { label: 'Maintenance & cleaning', free: true, pro: true },
  { label: 'Staff schedule', free: true, pro: true },
  { label: 'SOP management', free: true, pro: true },
  { label: 'Laporan keuangan dasar', free: true, pro: true },
  { label: 'FITUR PRO', free: '', pro: '', category: 'header' },
  { label: 'Business analytics lanjutan', free: false, pro: true },
  { label: 'Finance & Account', free: false, pro: true },
  { label: 'User Management lanjutan', free: false, pro: true },
  { label: 'Employee Management', free: false, pro: true },
  { label: 'Channel Manager (OTA sync)', free: false, pro: true },
  { label: 'Unlimited user accounts', free: '2', pro: true },
  { label: 'Priority support', free: false, pro: true },
]

const FAQ = [
  {
    q: 'Apakah saya bisa upgrade kapan saja?',
    a: 'Ya, kamu bisa upgrade dari Free ke Pro kapan saja. Fitur Pro langsung aktif setelah pembayaran dikonfirmasi.',
  },
  {
    q: 'Apakah ada masa trial untuk Pro?',
    a: 'Kami sedang menyiapkan trial 14 hari gratis. Daftar waitlist sekarang untuk mendapatkan akses pertama.',
  },
  {
    q: 'Metode pembayaran apa yang tersedia?',
    a: 'Kami akan mendukung transfer bank, kartu kredit/debit, dan dompet digital (GoPay, OVO, Dana). Pembayaran segera tersedia.',
  },
  {
    q: 'Apakah data saya aman jika saya downgrade?',
    a: 'Ya, semua data kamu tetap tersimpan. Jika downgrade ke Free, fitur Pro tidak bisa diakses tapi data tidak dihapus.',
  },
  {
    q: 'Bagaimana cara membatalkan langganan?',
    a: 'Kamu bisa batalkan kapan saja dari halaman Settings. Akses Pro tetap aktif hingga akhir periode billing.',
  },
]

function CellValue({ value, isPro: isProCol }: { value: string | boolean; isPro: boolean }) {
  if (value === true) {
    return (
      <Check
        className={cn('h-4 w-4 mx-auto', isProCol ? 'text-[#E1A62F]' : 'text-green-600')}
        strokeWidth={2.5}
      />
    )
  }
  if (value === false) {
    return <span className="text-muted-foreground/40 text-sm">—</span>
  }
  return <span className="text-xs text-muted-foreground">{value}</span>
}

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('bulanan')
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [showSticky, setShowSticky] = useState(false)
  const { plan } = useSubscription()
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardsRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
    )
    obs.observe(cardsRef.current)
    return () => obs.disconnect()
  }, [])

  const monthlyPrice = billing === 'bulanan' ? 'Rp 299.000' : 'Rp 249.000'
  const billingLabel = billing === 'bulanan' ? '/bln' : '/bln (ditagih tahunan)'
  const yearlyTotal = 'Rp 2.990.000/thn'

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Pilih paket yang sesuai
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sederhana, Transparan, Terjangkau
        </h1>
        <p className="text-sm text-muted-foreground">
          Mulai gratis, upgrade kapan saja saat villa kamu berkembang.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div className="inline-flex h-9 items-center rounded-full border border-border bg-muted p-1">
            {(['bulanan', 'tahunan'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setBilling(opt)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all capitalize',
                  billing === opt
                    ? 'bg-background text-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
          {billing === 'tahunan' && (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">
              Hemat 2 bulan
            </span>
          )}
        </div>
      </div>

      {/* Pricing cards */}
      <div ref={cardsRef} className="mx-auto grid max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
        {/* FREE */}
        <div className="rounded-2xl border border-border bg-background p-6 space-y-5">
          <div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              Free
            </span>
            <div className="mt-4">
              <p className="text-3xl font-bold">Rp 0</p>
              <p className="text-sm text-muted-foreground">/bulan forever</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Untuk villa kecil yang baru mulai digital
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={plan === 'FREE' || plan === undefined}
          >
            {plan === 'FREE' || plan === undefined ? 'Paket saat ini' : 'Downgrade ke Free'}
          </Button>

          <ul className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" strokeWidth={2.5} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* PRO */}
        <div className="relative flex flex-col rounded-2xl border-2 border-[#E1A62F] bg-[#FFFBF0] p-6 space-y-5">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-[#E1A62F] px-3 py-1 text-[11px] font-bold text-white shadow">
              Paling populer
            </span>
          </div>

          <div>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#E1A62F] bg-[#E1A62F22]">
              Pro
            </span>
            <div className="mt-4">
              <p className="text-3xl font-bold text-[#E1A62F]">{monthlyPrice}</p>
              <p className="text-sm text-muted-foreground">{billingLabel}</p>
              {billing === 'tahunan' && (
                <p className="text-xs text-muted-foreground mt-0.5">{yearlyTotal}</p>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Untuk villa yang ingin tumbuh dan profesional
            </p>
          </div>

          <Button
            className="w-full font-semibold"
            style={{ backgroundColor: '#E1A62F', color: 'white' }}
            onClick={() => setWaitlistOpen(true)}
          >
            Subscribe sekarang
          </Button>

          <ul className="space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2 text-sm">
                {f.star ? (
                  <Star
                    className="mt-0.5 h-4 w-4 shrink-0 fill-[#E1A62F] text-[#E1A62F]"
                  />
                ) : (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" strokeWidth={2.5} />
                )}
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Comparison table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-center">Perbandingan lengkap fitur</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-background border-b border-border">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground w-full">
                  Fitur
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground w-28">
                  Free
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-[#E1A62F] w-28">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row, i) => {
                if (row.category === 'header') {
                  return (
                    <tr key={i} className="bg-muted/50">
                      <td
                        colSpan={3}
                        className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        {row.label}
                      </td>
                    </tr>
                  )
                }
                return (
                  <tr key={i} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 text-sm">{row.label}</td>
                    <td className="px-5 py-3 text-center">
                      <CellValue value={row.free} isPro={false} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <CellValue value={row.pro} isPro={true} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* CTA below table */}
        <div className="rounded-xl border border-[#E1A62F33] bg-[#FFFBF0] px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
          <div>
            <p className="font-semibold text-sm">Siap upgrade?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unlock 5 fitur eksklusif yang mengakselerasi pertumbuhan villa kamu.
            </p>
          </div>
          <Button
            className="w-full shrink-0 font-semibold sm:w-auto"
            style={{ backgroundColor: '#E1A62F', color: 'white' }}
            onClick={() => setWaitlistOpen(true)}
          >
            Subscribe sekarang
          </Button>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-center">Pertanyaan umum</h2>
        <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
          {FAQ.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-sm font-medium text-left hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Sticky bottom CTA (appears when cards scroll out of view) */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-border bg-background/95 px-6 py-3 backdrop-blur-sm transition-all duration-300',
          showSticky ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        )}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold">Siap upgrade ke Pro?</p>
          <p className="truncate text-xs text-muted-foreground">
            {monthlyPrice}/bln · Unlock semua fitur eksklusif
          </p>
        </div>
        <Button
          className="shrink-0 text-xs font-semibold sm:text-sm"
          style={{ backgroundColor: '#E1A62F', color: 'white' }}
          onClick={() => setWaitlistOpen(true)}
        >
          <span className="hidden sm:inline">Subscribe sekarang</span>
          <span className="sm:hidden">Subscribe</span>
        </Button>
      </div>

      <WaitlistModal
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        billingPeriod={billing}
      />
    </div>
  )
}
