'use client'

import { useState } from 'react'
import { LayoutGrid, List, CalendarDays, Plus, Filter, ClipboardList } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import { ListView } from './list-view'
import { CalendarView } from './calendar-view'

const BoardView = dynamic(
  () => import('./board-view').then((m) => ({ default: m.BoardView })),
  {
    ssr: false,
    loading: () => <div className="h-[420px] animate-pulse rounded-xl bg-muted" />,
  }
)
import { TaskModal } from './task-modal'
import type { TaskFormData } from './task-modal'

export interface TaskData {
  id: string
  title: string
  type: string
  location: string
  priority: string
  status: string
  assignedTo: string | null
  dueDate: string | null
}

interface StaffOption {
  id: string
  name: string
}

interface Props {
  tasks: TaskData[]
  staffOptions: StaffOption[]
  locationOptions: string[]
}

const VIEWS = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'list', label: 'List', icon: List },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
] as const

type ViewId = (typeof VIEWS)[number]['id']

function toFormData(task: TaskData): TaskFormData {
  return {
    id: task.id,
    title: task.title,
    type: task.type as TaskFormData['type'],
    location: task.location,
    priority: task.priority as TaskFormData['priority'],
    assignedTo: task.assignedTo ?? undefined,
    dueDate: task.dueDate ?? undefined,
  }
}

export function MaintenanceClient({ tasks, staffOptions, locationOptions }: Props) {
  const [view, setView] = useState<ViewId>('board')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState<TaskFormData | null>(null)

  const openTasks = tasks.filter((t) => t.status !== 'DONE')

  function handleEdit(task: TaskData) {
    setEditTask(toFormData(task))
    setModalOpen(true)
  }

  function handleNew() {
    setEditTask(null)
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditTask(null)
  }

  const staffNames = staffOptions.map((s) => s.name)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center justify-between gap-2 sm:justify-start sm:gap-3">
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-sm font-medium transition-all sm:px-3',
                  view === id ? 'bg-background text-foreground shadow' : 'hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {openTasks.length} open task{openTasks.length !== 1 ? 's' : ''}
          </p>
          {/* Mobile: action buttons inline with view tabs */}
          <div className="flex items-center gap-2 sm:hidden">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <Filter className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={handleNew}>
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
        </div>
        {/* Desktop: action buttons */}
        <div className="hidden items-center gap-2 sm:flex">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleNew}>
            <Plus className="h-3.5 w-3.5" />
            New task
          </Button>
        </div>
      </div>

      {view === 'board' && (
        tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Belum ada tugas"
            description="Buat tugas maintenance atau kebersihan untuk staf kamu."
            actionLabel="+ Tugas baru"
            onAction={handleNew}
          />
        ) : (
          <BoardView tasks={tasks} onEdit={handleEdit} />
        )
      )}
      {view === 'list' && (
        tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Tidak ada tugas"
            description="Buat tugas baru untuk mulai melacak maintenance dan kebersihan."
            actionLabel="+ Tugas baru"
            onAction={handleNew}
          />
        ) : (
          <ListView tasks={tasks} staffNames={staffNames} onEdit={handleEdit} />
        )
      )}
      {view === 'calendar' && <CalendarView tasks={tasks} onEdit={handleEdit} />}

      <TaskModal
        open={modalOpen}
        onClose={handleClose}
        initial={editTask}
        locationOptions={locationOptions}
        staffOptions={staffOptions}
      />
    </div>
  )
}
