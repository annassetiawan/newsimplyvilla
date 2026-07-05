'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { moveTaskStatus } from '@/app/actions/tasks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/EmptyState'

interface Task {
  id: string
  title: string
  priority: string
  status: string
  assignedTo: string | null
  dueDate: string | null
}

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function DashboardTaskWidget({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [, startTransition] = useTransition()

  const openCount = tasks.length
  const highCount = tasks.filter((t) => t.priority === 'HIGH').length

  function handleComplete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    startTransition(async () => {
      await moveTaskStatus(id, 'DONE')
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Today&apos;s tasks</CardTitle>
          <Link
            href="/maintenance"
            className="flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="h-3 w-3" />
            New
          </Link>
        </div>
        <CardDescription>
          {openCount} open &middot; {highCount} high priority
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="Tidak ada tugas hari ini"
            description="Semua beres! Tidak ada tugas yang perlu dikerjakan hari ini."
            minHeight="min-h-[180px]"
          />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3">
                <button type="button"
                  aria-label={`Tandai ${task.title} selesai`}
                  onClick={() => handleComplete(task.id)}
                  title="Mark as done"
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-border transition-colors hover:border-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                />
                <Link
                  href="/maintenance"
                  className="min-w-0 flex-1 transition-opacity hover:opacity-70"
                >
                  <p className="text-sm font-medium leading-tight">{task.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {task.assignedTo ?? 'Unassigned'} &middot;{' '}
                    {task.dueDate ? fmtDate(task.dueDate) : 'No due date'}
                  </p>
                </Link>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.LOW
                  )}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
