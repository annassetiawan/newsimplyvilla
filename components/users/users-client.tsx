'use client'

import { useState, useTransition } from 'react'
import { Search, Plus, MoreHorizontal, UserPlus, SearchX } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toggleStaffActive } from '@/app/actions/staff'
import { StaffModal } from './staff-modal'

export interface StaffData {
  id: string
  name: string
  email: string
  position: string
  role: string
  isActive: boolean
}

interface Props {
  staff: StaffData[]
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function UsersClient({ staff }: Props) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editStaff, setEditStaff] = useState<StaffData | null>(null)
  const [pending, startTransition] = useTransition()

  const filtered = staff.filter((s) => {
    const matchSearch =
      search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || s.role === roleFilter
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' ? s.isActive : !s.isActive)
    return matchSearch && matchRole && matchStatus
  })

  function handleToggleActive(s: StaffData) {
    startTransition(async () => {
      await toggleStaffActive(s.id, !s.isActive)
    })
  }

  function openEdit(s: StaffData) {
    setEditStaff(s)
    setModalOpen(true)
  }

  function openNew() {
    setEditStaff(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              className="h-8 w-48 pl-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 w-28 text-sm">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-32 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-3.5 w-3.5" />
          Add staff
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff member</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && search === '' && roleFilter === 'ALL' && statusFilter === 'ALL' && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <UserPlus className="h-10 w-10 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
                    <p className="mt-1 text-[15px] font-medium text-neutral-700 dark:text-neutral-300">Belum ada anggota tim</p>
                    <p className="text-[13px] text-neutral-400 dark:text-neutral-500">Undang staf untuk membantu mengelola villa kamu.</p>
                    <button
                      onClick={openNew}
                      className="mt-3 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
                    >
                      + Undang staf
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtered.length === 0 && (search !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <SearchX className="h-8 w-8 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Staf tidak ditemukan</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">Coba kata kunci lain.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E1A62F] text-sm font-bold text-white">
                      {initials(s.name)}
                    </div>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{s.position}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      s.role === 'OWNER'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {s.role === 'OWNER' ? 'Owner' : 'Staff'}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      s.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(s)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={pending}
                        onClick={() => handleToggleActive(s)}
                      >
                        {s.isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => console.log(`Password reset email sent to ${s.email}`)}
                      >
                        Reset password
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StaffModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditStaff(null) }}
        initial={editStaff}
      />
    </div>
  )
}
