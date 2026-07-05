'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createEmployee, updateEmployee } from '@/app/actions/employee'
import type { Employee, StaffMember } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  employee: Employee | null
  staffList: StaffMember[]
  linkedStaffIds: string[]
}

const EMPTY: Omit<Employee, 'id' | 'villaId' | 'createdAt' | 'updatedAt' | 'staff'> = {
  name: '',
  photo: null,
  idNumber: null,
  birthPlace: null,
  birthDate: null,
  gender: null,
  phone: null,
  address: null,
  position: '',
  department: null,
  employmentType: 'PERMANENT',
  startDate: new Date().toISOString().split('T')[0],
  endDate: null,
  baseSalary: null,
  staffId: null,
  status: 'ACTIVE',
}

function toFormState(employee: Employee | null): typeof EMPTY {
  if (!employee) return { ...EMPTY, startDate: new Date().toISOString().split('T')[0] }
  return {
    name: employee.name,
    photo: employee.photo,
    idNumber: employee.idNumber,
    birthPlace: employee.birthPlace,
    birthDate: employee.birthDate ? employee.birthDate.split('T')[0] : null,
    gender: employee.gender,
    phone: employee.phone,
    address: employee.address,
    position: employee.position,
    department: employee.department,
    employmentType: employee.employmentType,
    startDate: employee.startDate.split('T')[0],
    endDate: employee.endDate ? employee.endDate.split('T')[0] : null,
    baseSalary: employee.baseSalary,
    staffId: employee.staffId,
    status: employee.status,
  }
}

export function EmployeeModal({ open, onClose, employee, staffList, linkedStaffIds }: Props) {
  const [form, setForm] = useState(() => toFormState(employee))
  const [isPending, startTransition] = useTransition()

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleClose() {
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.position.trim() || !form.startDate) {
      toast.error('Isi semua field yang wajib diisi')
      return
    }

    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        photo: form.photo?.trim() || undefined,
        idNumber: form.idNumber?.trim() || undefined,
        birthPlace: form.birthPlace?.trim() || undefined,
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
        position: form.position.trim(),
        department: form.department?.trim() || undefined,
        employmentType: form.employmentType,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        baseSalary: form.baseSalary || undefined,
        staffId: form.staffId || undefined,
        status: form.status,
      }

      const result = employee
        ? await updateEmployee(employee.id, payload)
        : await createEmployee(payload)

      if ('error' in result && result.error) {
        toast.error(result.error as string)
      } else {
        toast.success(employee ? 'Data karyawan diperbarui' : 'Karyawan berhasil ditambahkan')
        handleClose()
      }
    })
  }

  const availableStaff = staffList.filter(
    (s) => !linkedStaffIds.includes(s.id) || s.id === form.staffId
  )

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Karyawan' : 'Tambah Karyawan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Section: Identitas */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identitas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nama <span className="text-destructive">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Nama lengkap"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Foto (URL)</Label>
                <Input
                  value={form.photo ?? ''}
                  onChange={(e) => set('photo', e.target.value || null)}
                  placeholder="https://..."
                  type="url"
                />
              </div>
              <div className="space-y-1.5">
                <Label>No KTP</Label>
                <Input
                  value={form.idNumber ?? ''}
                  onChange={(e) => set('idNumber', e.target.value || null)}
                  placeholder="16 digit"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Jenis Kelamin</Label>
                <select
                  value={form.gender ?? ''}
                  onChange={(e) => set('gender', (e.target.value as 'MALE' | 'FEMALE') || null)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Pilih</option>
                  <option value="MALE">Laki-laki</option>
                  <option value="FEMALE">Perempuan</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Tempat Lahir</Label>
                <Input
                  value={form.birthPlace ?? ''}
                  onChange={(e) => set('birthPlace', e.target.value || null)}
                  placeholder="Jakarta"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal Lahir</Label>
                <Input
                  type="date"
                  value={form.birthDate ?? ''}
                  onChange={(e) => set('birthDate', e.target.value || null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>No HP</Label>
                <Input
                  value={form.phone ?? ''}
                  onChange={(e) => set('phone', e.target.value || null)}
                  placeholder="08xx"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Alamat</Label>
                <Textarea
                  value={form.address ?? ''}
                  onChange={(e) => set('address', e.target.value || null)}
                  placeholder="Alamat lengkap"
                  rows={2}
                />
              </div>
            </div>
          </section>

          {/* Section: Kepegawaian */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Kepegawaian</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Posisi / Jabatan <span className="text-destructive">*</span></Label>
                <Input
                  value={form.position}
                  onChange={(e) => set('position', e.target.value)}
                  placeholder="Front Desk, Housekeeping, dll"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Departemen</Label>
                <Input
                  value={form.department ?? ''}
                  onChange={(e) => set('department', e.target.value || null)}
                  placeholder="Operations, Finance, dll"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipe Karyawan <span className="text-destructive">*</span></Label>
                <select
                  value={form.employmentType}
                  onChange={(e) => set('employmentType', e.target.value as 'PERMANENT' | 'CONTRACT' | 'FREELANCE')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="PERMANENT">Tetap</option>
                  <option value="CONTRACT">Kontrak</option>
                  <option value="FREELANCE">Freelance / Harian</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Gaji Pokok (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.baseSalary ?? ''}
                  onChange={(e) => set('baseSalary', e.target.value ? Number(e.target.value) : null)}
                  placeholder="3000000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal Mulai <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal Akhir Kontrak</Label>
                <Input
                  type="date"
                  value={form.endDate ?? ''}
                  onChange={(e) => set('endDate', e.target.value || null)}
                />
              </div>
            </div>
          </section>

          {/* Section: Akun SimplyVilla */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Akun SimplyVilla (opsional)</h3>
            <div className="space-y-1.5">
              <Label>Hubungkan ke Staff</Label>
              <select
                value={form.staffId ?? ''}
                onChange={(e) => set('staffId', e.target.value || null)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Tidak dihubungkan</option>
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.email ? `(${s.email})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Hubungkan ke akun login SimplyVilla jika karyawan ini punya akses sistem
              </p>
            </div>
          </section>

          {/* Section: Status */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Status</h3>
            <div className="flex gap-2">
              {(['ACTIVE', 'INACTIVE'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                    form.status === s
                      ? s === 'ACTIVE'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'border-neutral-400 bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {s === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                </button>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              {isPending ? 'Menyimpan...' : employee ? 'Simpan Perubahan' : 'Tambah Karyawan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
