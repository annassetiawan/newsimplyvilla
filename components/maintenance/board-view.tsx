'use client'

import { useState, useTransition } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Clock, MapPin, ChevronRight, Loader, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { advanceStatus, moveTaskStatus } from '@/app/actions/tasks'
import type { TaskData } from './maintenance-client'

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
  MED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
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
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', TYPE_STYLE[task.type])}>
              {task.type === 'MAINTENANCE' ? 'Maintenance' : 'Cleaning'}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', PRIORITY_STYLE[task.priority])}>
              {task.priority === 'HIGH' ? 'High' : task.priority === 'MED' ? 'Medium' : 'Low'}
            </span>
          </div>
          <SheetTitle className={cn(isDone && 'line-through text-muted-foreground')}>
            {task.title}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">Status</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  task.status === 'PENDING'
                    ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    : task.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                )}
              >
                {STATUS_LABEL[task.status]}
              </span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">Location</span>
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{task.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">Assigned to</span>
              {task.assignedTo ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E1A62F] text-[10px] font-bold text-white">
                    {initials(task.assignedTo)}
                  </div>
                  <span className="text-sm">{task.assignedTo}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">Unassigned</span>
              )}
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">Due date</span>
              <span className="text-sm">
                {task.dueDate ? fmtDate(task.dueDate) : <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {!isDone && (
              <Button
                size="sm"
                className="gap-1.5"
                disabled={pending}
                onClick={handleAdvance}
              >
                {task.status === 'PENDING' ? 'Start task' : 'Mark as done'}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose()
                onEdit(task)
              }}
            >
              Edit task
            </Button>
          </div>
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

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...(dragHandleProps ?? {})}
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
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E1A62F] text-[9px] font-bold text-white">
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

export function BoardView({ tasks, onEdit }: Props) {
  const [detailTask, setDetailTask] = useState<TaskData | null>(null)
  const [, startTransition] = useTransition()

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId) return

    startTransition(async () => {
      await moveTaskStatus(
        draggableId,
        destination.droppableId as 'PENDING' | 'IN_PROGRESS' | 'DONE'
      )
    })
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status)
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
