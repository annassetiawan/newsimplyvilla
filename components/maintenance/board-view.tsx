'use client'

import { useState, useTransition } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Clock, MapPin, ChevronRight, Loader, CheckCircle, X, Pencil, Users, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { advanceStatus, moveTaskStatus } from '@/app/actions/tasks'
import type { TaskData } from './maintenance-client'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface Props {
  tasks: TaskData[]
  onEdit: (task: TaskData) => void
}

const COLUMNS = [
  {
    status: 'PENDING',
    label: 'Pending',
    badgeClass: 'bg-[#E1A62F] text-white',
    headerClass: 'text-amber-700 dark:text-amber-400',
    emptyIcon: Clock,
    emptyText: 'Tidak ada tugas pending',
  },
  {
    status: 'IN_PROGRESS',
    label: 'In Progress',
    badgeClass: 'bg-blue-500 text-white',
    headerClass: 'text-blue-700 dark:text-blue-400',
    emptyIcon: Loader,
    emptyText: 'Tidak ada tugas berjalan',
  },
  {
    status: 'DONE',
    label: 'Done',
    badgeClass: 'bg-green-500 text-white',
    headerClass: 'text-green-700 dark:text-green-400',
    emptyIcon: CheckCircle,
    emptyText: 'Belum ada tugas selesai hari ini',
  },
] as const

const TYPE_STYLE: Record<string, string> = {
  MAINTENANCE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  CLEANING: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
}

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  MED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  LOW: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
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

function TaskDetailSheet({
  task,
  onClose,
  onEdit,
}: {
  task: TaskData | null
  onClose: () => void
  onEdit: (task: TaskData) => void
}) {
  const [pending, startTransition] = useTransition()

  if (!task) return null
  const isDone = task.status === 'DONE'

  function handleAdvance() {
    startTransition(async () => {
      await advanceStatus(task!.id, task!.status)
      onClose()
    })
  }

  return (
    <Sheet open={!!task} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" showCloseButton={false} className="flex flex-col gap-0 p-0 w-full sm:max-w-md">
        <SheetTitle className="sr-only">Task detail</SheetTitle>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div className="min-w-0 flex-1 pr-3">
            <p className={cn('text-base font-semibold leading-snug mb-2', isDone && 'line-through text-muted-foreground')}>
              {task.title}
            </p>
            <div className="flex items-center gap-1.5">
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', TYPE_STYLE[task.type])}>
                {task.type === 'MAINTENANCE' ? 'Maintenance' : 'Cleaning'}
              </span>
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', PRIORITY_STYLE[task.priority])}>
                {task.priority === 'HIGH' ? 'High' : task.priority === 'MED' ? 'Medium' : 'Low'}
              </span>
            </div>
          </div>
          <button type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Task Info
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Status</span>
              </div>
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold',
                task.status === 'PENDING'
                  ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  : task.status === 'IN_PROGRESS'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              )}>
                {STATUS_LABEL[task.status]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </div>
              <span className="text-sm font-medium">{task.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Assigned to</span>
              </div>
              {task.assignedTo ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[9px] font-bold text-white">
                    {initials(task.assignedTo)}
                  </div>
                  <span className="text-sm font-medium">{task.assignedTo}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">Unassigned</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Due date</span>
              </div>
              <span className="text-sm font-medium">
                {task.dueDate ? fmtDate(task.dueDate) : <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="border-t border-border px-6 py-4 space-y-2">
          {!isDone && (
            <Button
              className="w-full bg-neutral-800 text-white hover:bg-neutral-700 gap-1.5"
              disabled={pending}
              onClick={handleAdvance}
            >
              {task.status === 'PENDING' ? 'Start task' : 'Mark as done'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onClose()
              onEdit(task)
            }}
          >
            <Pencil className="h-4 w-4" />
            Edit task
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function TaskCard({
  task,
  onOpenDetail,
  dragHandleProps,
  draggableProps,
  innerRef,
}: {
  task: TaskData
  onOpenDetail: () => void
  dragHandleProps: object | null
  draggableProps: object
  innerRef: (el: HTMLElement | null) => void
}) {
  const isDone = task.status === 'DONE'
  // dragHandleProps already carries its own role/tabIndex/onKeyDown for
  // keyboard drag (space to lift, arrows to move) — compose rather than
  // clobber so Enter also opens the detail sheet without breaking drag.
  const dragProps = (dragHandleProps ?? {}) as Record<string, unknown> & {
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    dragProps.onKeyDown?.(e)
    if (!e.defaultPrevented && e.key === 'Enter') onOpenDetail()
  }

  return (
    <div
      ref={innerRef}
      role="button"
      tabIndex={0}
      {...draggableProps}
      {...dragProps}
      onKeyDown={handleKeyDown}
      onClick={onOpenDetail}
      className={cn(
        'bg-card rounded-lg border border-border shadow-sm p-3.5 space-y-2.5 cursor-pointer',
        'transition-colors hover:border-[#E1A62F]',
        isDone && 'opacity-70'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', TYPE_STYLE[task.type])}>
          {task.type === 'MAINTENANCE' ? 'Maintenance' : 'Cleaning'}
        </span>
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', PRIORITY_STYLE[task.priority])}>
          {task.priority === 'HIGH' ? 'High' : task.priority === 'MED' ? 'Med' : 'Low'}
        </span>
      </div>

      <p className={cn('text-sm font-medium leading-tight', isDone && 'line-through text-muted-foreground')}>
        {task.title}
      </p>

      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">{task.location}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.assignedTo ? (
            <>
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[9px] font-bold text-white">
                {initials(task.assignedTo)}
              </div>
              <span className="text-[11px] text-muted-foreground truncate">
                {task.assignedTo}
              </span>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
          )}
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            <span>{fmtDate(task.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

type DragOverride = { taskId: string; status: 'PENDING' | 'IN_PROGRESS' | 'DONE' }

export function BoardView({ tasks, onEdit }: Props) {
  // Optimistic drag override: only holds a value until `tasks` reflects it,
  // then self-evicts — no effect needed to keep it in sync with the prop.
  const [dragOverride, setDragOverride] = useState<DragOverride | null>(null)
  const [detailTask, setDetailTask] = useState<TaskData | null>(null)
  const [, startTransition] = useTransition()
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const [mobileCol, setMobileCol] = useState<'PENDING' | 'IN_PROGRESS' | 'DONE'>('PENDING')

  const pendingOverride =
    dragOverride && tasks.find((t) => t.id === dragOverride.taskId)?.status !== dragOverride.status
      ? dragOverride
      : null

  const localTasks = pendingOverride
    ? tasks.map((t) => (t.id === pendingOverride.taskId ? { ...t, status: pendingOverride.status } : t))
    : tasks

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId) return

    const newStatus = destination.droppableId as 'PENDING' | 'IN_PROGRESS' | 'DONE'
    setDragOverride({ taskId: draggableId, status: newStatus })

    startTransition(async () => {
      const res = await moveTaskStatus(draggableId, newStatus)
      if (!res.success) {
        setDragOverride(null)
      }
    })
  }

  return (
    <>
      {/* Mobile column selector */}
      {isMobile && (
        <div className="flex gap-1 rounded-lg bg-muted p-1 lg:hidden">
          {COLUMNS.map((col) => {
            const count = localTasks.filter((t) => t.status === col.status).length
            return (
              <button type="button"
                key={col.status}
                onClick={() => setMobileCol(col.status)}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  mobileCol === col.status
                    ? 'bg-background text-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {col.label}
                <span className="ml-1.5 text-xs tabular-nums">({count})</span>
              </button>
            )
          })}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className={cn(isMobile ? 'block' : 'grid grid-cols-3 gap-4')}>
          {COLUMNS.map((col) => {
            const colTasks = localTasks.filter((t) => t.status === col.status)
            if (isMobile && col.status !== mobileCol) return null
            return (
              <div key={col.status} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <p className={cn('text-sm font-semibold', col.headerClass)}>{col.label}</p>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-bold',
                      col.badgeClass
                    )}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <Droppable droppableId={col.status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'rounded-xl p-2.5 space-y-2 min-h-[200px] transition-colors',
                        snapshot.isDraggingOver
                          ? 'bg-amber-50 dark:bg-amber-950/20'
                          : 'bg-muted/50 dark:bg-muted/30'
                      )}
                    >
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center min-h-[120px]">
                          <col.emptyIcon className="h-6 w-6 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">{col.emptyText}</p>
                        </div>
                      )}
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <TaskCard
                              task={task}
                              onOpenDetail={() => setDetailTask(task)}
                              dragHandleProps={provided.dragHandleProps ?? null}
                              draggableProps={provided.draggableProps}
                              innerRef={provided.innerRef}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      <TaskDetailSheet
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onEdit={(task) => {
          setDetailTask(null)
          onEdit(task)
        }}
      />
    </>
  )
}
