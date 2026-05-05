'use client'

import { useTransition } from 'react'
import { Clock, MapPin, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { advanceStatus } from '@/app/actions/tasks'
import type { TaskData } from './maintenance-client'

interface Props {
  tasks: TaskData[]
  onEdit: (task: TaskData) => void
}

const COLUMNS = [
  { status: 'PENDING', label: 'Pending', color: 'text-gray-600' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'text-blue-600' },
  { status: 'DONE', label: 'Done', color: 'text-green-600' },
] as const

const TYPE_STYLE: Record<string, string> = {
  MAINTENANCE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  CLEANING: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function TaskCard({ task, onEdit }: { task: TaskData; onEdit: () => void }) {
  const [pending, startTransition] = useTransition()
  const isDone = task.status === 'DONE'

  function handleAdvance() {
    startTransition(async () => {
      await advanceStatus(task.id, task.status)
    })
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-background p-3.5 space-y-2.5 cursor-pointer hover:shadow-sm transition-shadow',
        isDone && 'opacity-70'
      )}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', TYPE_STYLE[task.type])}>
          {task.type === 'MAINTENANCE' ? 'Maintenance' : 'Cleaning'}
        </span>
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', PRIORITY_STYLE[task.priority])}>
          {task.priority}
        </span>
      </div>

      <p className={cn('text-sm font-semibold leading-tight', isDone && 'line-through text-muted-foreground')}>
        {task.title}
      </p>

      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0" />
        <span>{task.location}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {task.assignedTo && (
            <>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                {initials(task.assignedTo)}
              </div>
              <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
                {task.assignedTo}
              </span>
            </>
          )}
          {!task.assignedTo && (
            <span className="text-[11px] text-muted-foreground">Unassigned</span>
          )}
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            <span>{fmtDate(task.dueDate)}</span>
          </div>
        )}
      </div>

      {!isDone && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs gap-1"
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation()
            handleAdvance()
          }}
        >
          {task.status === 'PENDING' ? 'Start task' : 'Mark done'}
          <ChevronRight className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

export function BoardView({ tasks, onEdit }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status)
        return (
          <div key={col.status} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <p className={cn('text-sm font-semibold', col.color)}>{col.label}</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {colTasks.length}
              </span>
            </div>
            <div className="space-y-2 min-h-[100px]">
              {colTasks.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No tasks
                </div>
              )}
              {colTasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={() => onEdit(task)} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
