'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { TaskData } from './maintenance-client'

interface Props {
  tasks: TaskData[]
  onEdit: (task: TaskData) => void
}

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MED: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-gray-100 text-gray-600 border-gray-200',
}

function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function CalendarView({ tasks, onEdit }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  function prevWeek() {
    setWeekStart((d) => {
      const n = new Date(d)
      n.setDate(n.getDate() - 7)
      return n
    })
  }
  function nextWeek() {
    setWeekStart((d) => {
      const n = new Date(d)
      n.setDate(n.getDate() + 7)
      return n
    })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function getTasksForDay(day: Date) {
    return tasks.filter((t) => {
      if (!t.dueDate) return false
      const d = new Date(t.dueDate)
      d.setHours(0, 0, 0, 0)
      return d.getTime() === day.getTime()
    })
  }

  const unscheduled = tasks.filter((t) => !t.dueDate)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[220px] text-center text-sm font-medium">
          {days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
          {days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <Button variant="outline" size="sm" onClick={nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isToday = day.getTime() === today.getTime()
          const dayTasks = getTasksForDay(day)
          return (
            <div key={day.toISOString()} className="space-y-1">
              <div
                className={cn(
                  'rounded-lg px-2 py-1.5 text-center',
                  isToday ? 'bg-primary/10' : 'bg-muted/40'
                )}
              >
                <p
                  className={cn(
                    'text-[11px] font-medium',
                    isToday ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                </p>
                <p
                  className={cn(
                    'text-base font-bold',
                    isToday ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {day.getDate()}
                </p>
              </div>
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <button type="button"
                    key={task.id}
                    className={cn(
                      'w-full rounded-md border p-1.5 text-left text-[11px] font-medium transition-opacity hover:opacity-80',
                      PRIORITY_COLOR[task.priority],
                      task.status === 'DONE' && 'opacity-50 line-through'
                    )}
                    onClick={() => onEdit(task)}
                  >
                    <p className="truncate">{task.title}</p>
                    <div className="mt-0.5 flex items-center gap-0.5 opacity-70">
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{task.location}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {unscheduled.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unscheduled ({unscheduled.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((task) => (
              <button type="button"
                key={task.id}
                className={cn(
                  'rounded-md border px-2 py-1 text-[11px] font-medium hover:opacity-80',
                  PRIORITY_COLOR[task.priority]
                )}
                onClick={() => onEdit(task)}
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
