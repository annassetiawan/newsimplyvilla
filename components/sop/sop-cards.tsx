'use client'

import { Clock, ListOrdered, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface SOPData {
  id: string
  title: string
  category: string
  estimatedMinutes: number
  steps: { step: number; text: string }[]
  updatedAt: string
}

export const CATEGORIES = [
  { key: 'ALL', label: 'All SOPs' },
  { key: 'FRONT_DESK', label: 'Front Desk' },
  { key: 'HOUSEKEEPING', label: 'Housekeeping' },
  { key: 'MAINTENANCE', label: 'Maintenance' },
  { key: 'INVENTORY', label: 'Inventory' },
  { key: 'SAFETY', label: 'Safety' },
] as const

const CAT_LABEL: Record<string, string> = {
  FRONT_DESK: 'Front Desk',
  HOUSEKEEPING: 'Housekeeping',
  MAINTENANCE: 'Maintenance',
  INVENTORY: 'Inventory',
  SAFETY: 'Safety',
}

const CAT_COLOR: Record<string, string> = {
  FRONT_DESK: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HOUSEKEEPING: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  MAINTENANCE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  INVENTORY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SAFETY: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function formatSOPDate(iso: string, year = false) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(year ? { year: 'numeric' } : {}),
  })
}

// ─── Category filter (mobile pills + desktop list) ────────────────────────────

interface SOPCategoryFilterProps {
  activeCategory: string
  onSelect: (key: string) => void
  countFor: (key: string) => number
}

export function SOPCategoryFilter({ activeCategory, onSelect, countFor }: SOPCategoryFilterProps) {
  return (
    <div className="lg:w-52 lg:shrink-0">
      <p className="mb-2 hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
        Categories
      </p>
      {/* Mobile: horizontal scrollable pills */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              activeCategory === key
                ? 'bg-foreground text-background'
                : 'border border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
            <span className="ml-1.5 text-xs tabular-nums opacity-70">({countFor(key)})</span>
          </button>
        ))}
      </div>
      {/* Desktop: vertical list */}
      <div className="hidden space-y-0.5 lg:block">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
              activeCategory === key
                ? 'bg-muted font-semibold text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <span>{label}</span>
            <span className="text-xs tabular-nums">{countFor(key)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Featured card ────────────────────────────────────────────────────────────

export function SOPFeaturedCard({ sop, onOpen }: { sop: SOPData; onOpen: () => void }) {
  return (
    <div
      className="rounded-xl border border-border bg-background p-4 cursor-pointer hover:shadow-sm transition-shadow lg:p-6"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen() }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                CAT_COLOR[sop.category]
              )}
            >
              {CAT_LABEL[sop.category]}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              Featured
            </span>
          </div>
          <h2 className="text-xl font-bold mb-3">{sop.title}</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ListOrdered className="h-3.5 w-3.5" />
              {sop.steps.length} steps
            </span>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              ~{sop.estimatedMinutes} min
            </span>
            <span>&middot;</span>
            <span>Updated {formatSOPDate(sop.updatedAt)}</span>
          </div>
        </div>

        {/* Right — first 3 steps, hidden on mobile */}
        <div className="hidden w-64 shrink-0 lg:block">
          <p className="mb-2.5 text-xs font-semibold text-muted-foreground">
            First 3 steps
          </p>
          <ol className="space-y-2.5">
            {sop.steps.slice(0, 3).map((s) => (
              <li key={s.step} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                  {s.step}
                </span>
                <p className="text-sm leading-snug">{s.text}</p>
              </li>
            ))}
            {sop.steps.length > 3 && (
              <li className="pl-7 text-xs text-muted-foreground">
                + {sop.steps.length - 3} more steps
              </li>
            )}
          </ol>
        </div>
      </div>
    </div>
  )
}

// ─── Grid card ────────────────────────────────────────────────────────────────

interface SOPGridCardProps {
  sop: SOPData
  pending: boolean
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}

export function SOPGridCard({ sop, pending, onOpen, onEdit, onDelete }: SOPGridCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-background p-4 cursor-pointer hover:shadow-sm transition-shadow"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen() }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-foreground">
          {CAT_LABEL[sop.category]}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <h3 className="font-semibold text-sm mb-4 line-clamp-2">{sop.title}</h3>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ListOrdered className="h-3 w-3" />
          {sop.steps.length} steps
        </span>
        <span>Updated {formatSOPDate(sop.updatedAt)}</span>
      </div>
    </div>
  )
}

// ─── Detail dialog ────────────────────────────────────────────────────────────

interface SOPDetailDialogProps {
  sop: SOPData | null
  onClose: () => void
  onEdit: (sop: SOPData) => void
}

export function SOPDetailDialog({ sop, onClose, onEdit }: SOPDetailDialogProps) {
  return (
    <Dialog open={!!sop} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {sop && (
          <>
            <DialogHeader className="mb-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                    CAT_COLOR[sop.category]
                  )}
                >
                  {CAT_LABEL[sop.category]}
                </span>
              </div>
              <DialogTitle>{sop.title}</DialogTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ListOrdered className="h-3 w-3" />
                  {sop.steps.length} steps
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {sop.estimatedMinutes} min
                </span>
                <span>Updated {formatSOPDate(sop.updatedAt, true)}</span>
              </div>
            </DialogHeader>
            <div className="flex justify-end mb-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(sop)}
              >
                Edit SOP
              </Button>
            </div>
            <ol className="space-y-3">
              {sop.steps.map((s) => (
                <li key={s.step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
                    {s.step}
                  </span>
                  <p className="text-sm leading-relaxed pt-0.5">{s.text}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
