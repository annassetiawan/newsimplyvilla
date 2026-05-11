'use client'

import { useState, useTransition } from 'react'
import { Search, Plus, MoreHorizontal, Clock, ListOrdered, X, BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { deleteSOP } from '@/app/actions/sop'
import { SOPModal } from './sop-modal'

export interface SOPData {
  id: string
  title: string
  category: string
  estimatedMinutes: number
  steps: { step: number; text: string }[]
  updatedAt: string
}

const CATEGORIES = [
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

function formatDate(iso: string, year = false) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(year ? { year: 'numeric' } : {}),
  })
}

interface Props {
  sops: SOPData[]
}

export function SOPClient({ sops }: Props) {
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editSOP, setEditSOP] = useState<SOPData | null>(null)
  const [detailSOP, setDetailSOP] = useState<SOPData | null>(null)
  const [pending, startTransition] = useTransition()

  const lastUpdated = sops.length
    ? formatDate(
        sops.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b)).updatedAt,
        true
      )
    : '—'

  const filtered = sops.filter((s) => {
    const matchCat = activeCategory === 'ALL' || s.category === activeCategory
    const matchSearch =
      search === '' || s.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const featured = filtered[0] ?? null
  const grid = filtered.slice(1)

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSOP(id)
    })
  }

  function openEdit(sop: SOPData) {
    setEditSOP(sop)
    setModalOpen(true)
  }

  function openNew() {
    setEditSOP(null)
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditSOP(null)
  }

  const countFor = (cat: string) =>
    cat === 'ALL' ? sops.length : sops.filter((s) => s.category === cat).length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Standard Operating Procedures</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {sops.length} active procedures &middot; last updated {lastUpdated}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {searchOpen ? (
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search SOPs..."
                className="h-9 w-full pl-8 pr-8 text-sm sm:w-52"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => { setSearch(''); setSearchOpen(false) }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Search SOPs</span>
            </button>
          )}
          <Button size="sm" className="gap-1.5" onClick={openNew}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New SOP</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Categories — horizontal pills on mobile, vertical sidebar on desktop */}
        <div className="lg:w-52 lg:shrink-0">
          <p className="mb-2 hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
            Categories
          </p>
          {/* Mobile: horizontal scrollable pills */}
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {CATEGORIES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
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
                onClick={() => setActiveCategory(key)}
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

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-3">
          {filtered.length === 0 && activeCategory === 'ALL' && (
            <EmptyState
              icon={BookOpen}
              title="Belum ada SOP"
              description="Buat SOP untuk membantu staf bekerja sesuai standar villa kamu."
              actionLabel="+ Buat SOP"
              onAction={openNew}
            />
          )}
          {filtered.length === 0 && activeCategory !== 'ALL' && (
            <EmptyState
              icon={BookOpen}
              title="Belum ada SOP di kategori ini"
              description="Tambahkan SOP baru atau pilih kategori lain."
              actionLabel="+ Buat SOP"
              onAction={openNew}
              minHeight="min-h-[240px]"
            />
          )}

          {/* Featured card — two-column layout */}
          {featured && (
            <div
              className="rounded-xl border border-border bg-background p-4 cursor-pointer hover:shadow-sm transition-shadow lg:p-6"
              onClick={() => setDetailSOP(featured)}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                        CAT_COLOR[featured.category]
                      )}
                    >
                      {CAT_LABEL[featured.category]}
                    </span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      Featured
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mb-3">{featured.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ListOrdered className="h-3.5 w-3.5" />
                      {featured.steps.length} steps
                    </span>
                    <span>&middot;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      ~{featured.estimatedMinutes} min
                    </span>
                    <span>&middot;</span>
                    <span>Updated {formatDate(featured.updatedAt)}</span>
                  </div>
                </div>

                {/* Right — first 3 steps, hidden on mobile */}
                <div className="hidden w-64 shrink-0 lg:block">
                  <p className="mb-2.5 text-xs font-semibold text-muted-foreground">
                    First 3 steps
                  </p>
                  <ol className="space-y-2.5">
                    {featured.steps.slice(0, 3).map((s) => (
                      <li key={s.step} className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                          {s.step}
                        </span>
                        <p className="text-sm leading-snug">{s.text}</p>
                      </li>
                    ))}
                    {featured.steps.length > 3 && (
                      <li className="pl-7 text-xs text-muted-foreground">
                        + {featured.steps.length - 3} more steps
                      </li>
                    )}
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Grid cards */}
          {grid.length > 0 && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {grid.map((sop) => (
                <div
                  key={sop.id}
                  className="rounded-xl border border-border bg-background p-4 cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => setDetailSOP(sop)}
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
                            openEdit(sop)
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
                            handleDelete(sop.id)
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
                    <span>Updated {formatDate(sop.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailSOP} onOpenChange={(o) => !o && setDetailSOP(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {detailSOP && (
            <>
              <DialogHeader className="mb-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                      CAT_COLOR[detailSOP.category]
                    )}
                  >
                    {CAT_LABEL[detailSOP.category]}
                  </span>
                </div>
                <DialogTitle>{detailSOP.title}</DialogTitle>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ListOrdered className="h-3 w-3" />
                    {detailSOP.steps.length} steps
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {detailSOP.estimatedMinutes} min
                  </span>
                  <span>Updated {formatDate(detailSOP.updatedAt, true)}</span>
                </div>
              </DialogHeader>
              <div className="flex justify-end mb-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDetailSOP(null)
                    openEdit(detailSOP)
                  }}
                >
                  Edit SOP
                </Button>
              </div>
              <ol className="space-y-3">
                {detailSOP.steps.map((s) => (
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

      <SOPModal open={modalOpen} onClose={handleModalClose} initial={editSOP} />
    </div>
  )
}
