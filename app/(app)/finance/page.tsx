import { ProGate } from '@/components/ProGate'

export default function FinancePage() {
  return (
    <ProGate
      feature="Finance & Account"
      description="Kelola keuangan villa lebih profesional dengan laporan pajak, multi-akun bank, dan invoice otomatis ke tamu."
    >
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance & Account</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Advanced financial management, tax reports, and automated invoicing.
          </p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-border p-16 text-center text-sm text-muted-foreground">
          Finance & Account — coming soon
        </div>
      </div>
    </ProGate>
  )
}
