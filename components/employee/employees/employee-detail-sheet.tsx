'use client'

import Image from 'next/image'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import type { Employee } from '../types'
import { cn } from '@/lib/utils'

interface Props {
  employee: Employee
  open: boolean
  onClose: () => void
  onEdit: () => void
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  PERMANENT: 'Tetap',
  CONTRACT: 'Kontrak',
  FREELANCE: 'Freelance / Harian',
}

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Laki-laki',
  FEMALE: 'Perempuan',
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function fmtRp(n: number | null) {
  if (!n) return '—'
  return 'Rp ' + n.toLocaleString('id-ID')
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

export function EmployeeDetailSheet({ employee, open, onClose, onEdit }: Props) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between pr-6">
            <span>Detail Karyawan</span>
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="gap-1.5 h-8"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            {employee.photo ? (
              <Image src={employee.photo} alt={employee.name} width={56} height={56} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-neutral-800 dark:bg-neutral-200 flex items-center justify-center">
                <span className="text-lg font-bold text-white dark:text-neutral-900">
                  {employee.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-base font-semibold">{employee.name}</p>
              <p className="text-sm text-muted-foreground">{employee.position}</p>
              <span className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1',
                employee.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
              )}>
                {employee.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>

          {/* Identitas */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2">Identitas</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="No KTP" value={employee.idNumber ?? '—'} />
              <Field label="Jenis Kelamin" value={employee.gender ? GENDER_LABELS[employee.gender] : '—'} />
              <Field label="Tempat Lahir" value={employee.birthPlace ?? '—'} />
              <Field label="Tanggal Lahir" value={fmtDate(employee.birthDate)} />
              <Field label="No HP" value={employee.phone ?? '—'} />
            </div>
            {employee.address && (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Alamat</p>
                <p className="text-sm">{employee.address}</p>
              </div>
            )}
          </section>

          {/* Kepegawaian */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2">Kepegawaian</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Departemen" value={employee.department ?? '—'} />
              <Field label="Tipe" value={EMPLOYMENT_LABELS[employee.employmentType]} />
              <Field label="Tanggal Mulai" value={fmtDate(employee.startDate)} />
              <Field label="Akhir Kontrak" value={fmtDate(employee.endDate)} />
              <Field label="Gaji Pokok" value={fmtRp(employee.baseSalary)} />
            </div>
          </section>

          {/* Akun SimplyVilla */}
          {employee.staff && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2">Akun SimplyVilla</h3>
              <div className="rounded-lg border border-border p-3 flex items-center gap-3 bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-neutral-800 dark:bg-neutral-200 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-white dark:text-neutral-900">
                    {employee.staff.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{employee.staff.name}</p>
                  {employee.staff.email && (
                    <p className="text-xs text-muted-foreground">{employee.staff.email}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          <p className="text-xs text-muted-foreground">
            Bergabung sejak {fmtDate(employee.createdAt)}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
