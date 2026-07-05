'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, UserSquare2, Pencil, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { deactivateEmployee } from '@/app/actions/employee'
import { EmployeeModal } from './employee-modal'
import { EmployeeDetailSheet } from './employee-detail-sheet'
import type { Employee, StaffMember } from '../types'
import { cn } from '@/lib/utils'

interface Props {
  employees: Employee[]
  staffList: StaffMember[]
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  PERMANENT: 'Tetap',
  CONTRACT: 'Kontrak',
  FREELANCE: 'Freelance',
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function EmployeeList({ employees, staffList }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [detailTarget, setDetailTarget] = useState<Employee | null>(null)
  const [deactivating, setDeactivating] = useState<string | null>(null)

  const active = employees.filter((e) => e.status === 'ACTIVE')

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(e: Employee, ev: React.MouseEvent) {
    ev.stopPropagation()
    setEditTarget(e)
    setModalOpen(true)
  }

  async function handleDeactivate(e: Employee, ev: React.MouseEvent) {
    ev.stopPropagation()
    if (!confirm(`Nonaktifkan ${e.name}?`)) return
    setDeactivating(e.id)
    await deactivateEmployee(e.id)
    toast.success(`${e.name} dinonaktifkan`)
    setDeactivating(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{active.length}</span> Karyawan Aktif
          </span>
          {employees.length > active.length && (
            <span className="text-xs text-muted-foreground">
              ({employees.length - active.length} nonaktif)
            </span>
          )}
        </div>
        <Button
          onClick={openCreate}
          className="bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Karyawan
        </Button>
      </div>

      {/* Table */}
      {employees.length === 0 ? (
        <EmptyState
          icon={UserSquare2}
          title="Belum ada karyawan"
          description="Tambahkan data karyawan pertama Anda untuk mulai mengelola absensi dan cuti."
          actionLabel="Tambah Karyawan"
          onAction={openCreate}
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nama</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Posisi</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Departemen</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Tipe</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Tgl Mulai</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" aria-label="Aksi" />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr
                  key={emp.id}
                  className={cn(
                    'transition-colors hover:bg-muted/50',
                    i < employees.length - 1 && 'border-b border-border'
                  )}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDetailTarget(emp)}
                      className="flex items-center gap-3 text-left"
                    >
                      {emp.photo ? (
                        <Image src={emp.photo} alt={emp.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-800 dark:bg-neutral-200 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold text-white dark:text-neutral-900">
                            {emp.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium">{emp.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.position}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{emp.department || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <Badge variant="outline" className="text-xs">
                      {EMPLOYMENT_LABELS[emp.employmentType]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{fmtDate(emp.startDate)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      emp.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                    )}>
                      {emp.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button type="button"
                        aria-label={`Edit ${emp.name}`}
                        onClick={(ev) => openEdit(emp, ev)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {emp.status === 'ACTIVE' && (
                        <button type="button"
                          aria-label={`Nonaktifkan ${emp.name}`}
                          onClick={(ev) => handleDeactivate(emp, ev)}
                          disabled={deactivating === emp.id}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Nonaktifkan"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EmployeeModal
        key={modalOpen ? (editTarget?.id ?? 'new') : 'closed'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        employee={editTarget}
        staffList={staffList}
        linkedStaffIds={employees.flatMap((e) => (e.staffId && e.id !== editTarget?.id ? [e.staffId] : []))}
      />

      {detailTarget && (
        <EmployeeDetailSheet
          employee={detailTarget}
          open={!!detailTarget}
          onClose={() => setDetailTarget(null)}
          onEdit={() => {
            setEditTarget(detailTarget)
            setDetailTarget(null)
            setModalOpen(true)
          }}
        />
      )}
    </div>
  )
}
