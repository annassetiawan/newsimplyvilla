'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { advanceStatus, deleteTask } from '@/app/actions/tasks'
import type { TaskData } from './maintenance-client'

interface Props {
  tasks: TaskData[]
  staffNames: string[]
  onEdit: (task: TaskData) => void
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DONE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MED: 'bg-amber-100 text-amber-700',
  LOW: 'bg-gray-100 text-gray-600',
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ListView({ tasks, staffNames, onEdit }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [staffFilter, setStaffFilter] = useState('ALL')
  const [pending, startTransition] = useTransition()

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase()
    const matchQ = t.title.toLowerCase().includes(q) || t.location.toLowerCase().includes(q)
    const matchType = typeFilter === 'ALL' || t.type === typeFilter
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter
    const matchStaff =
      staffFilter === 'ALL' ||
      (staffFilter === 'UNASSIGNED' ? !t.assignedTo : t.assignedTo === staffFilter)
    return matchQ && matchType && matchPriority && matchStatus && matchStaff
  })

  function handleAdvance(task: TaskData) {
    startTransition(async () => {
      await advanceStatus(task.id, task.status)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTask(id)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="h-8 w-48 pl-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="CLEANING">Cleaning</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priority</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MED">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={staffFilter} onValueChange={setStaffFilter}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All staff</SelectItem>
            <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
            {staffNames.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned to</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Tidak ada tugas ditemukan</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">Coba ubah filter atau buat tugas baru.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((task) => (
              <TableRow key={task.id} className="cursor-pointer" onClick={() => onEdit(task)}>
                <TableCell>
                  <p
                    className={cn(
                      'font-medium',
                      task.status === 'DONE' && 'line-through text-muted-foreground'
                    )}
                  >
                    {task.title}
                  </p>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      task.type === 'MAINTENANCE'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-teal-100 text-teal-700'
                    )}
                  >
                    {task.type === 'MAINTENANCE' ? 'Maintenance' : 'Cleaning'}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{task.location}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      PRIORITY_STYLE[task.priority]
                    )}
                  >
                    {task.priority}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {task.assignedTo ?? <span className="italic">Unassigned</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{fmtDate(task.dueDate)}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      STATUS_STYLE[task.status]
                    )}
                  >
                    {STATUS_LABEL[task.status]}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(task)}>Edit</DropdownMenuItem>
                      {task.status !== 'DONE' && (
                        <DropdownMenuItem
                          disabled={pending}
                          onClick={() => handleAdvance(task)}
                        >
                          {task.status === 'PENDING' ? 'Start task' : 'Mark as done'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={pending}
                        onClick={() => handleDelete(task.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
