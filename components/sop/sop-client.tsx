'use client'

import { useState, useTransition } from 'react'
import { Search, Plus, MoreHorizontal, Clock, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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
  FRONT_DESK: 'bg-blue-100 text-blue-700',
  HOUSEKEEPING: 'bg-teal-100 text-teal-700',
  MAINTENANCE: 'bg-orange-100 text-orange-700',
  INVENTORY: 'bg-purple-100 text-purple-700',
  SAFETY: 'bg-red-100 text-red-700',
}

interface Props {
  sops: SOPData[]
}

export function SOPClient({ sops }: Props) {
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editSOP, setEditSOP] = useState<SOPData | null>(null)
  const [detailSOP, setDetailSOP] = useState<SOPData | null>(null)
  const [pending, startTransition] = useTransition()

  const filtered = sops.filter((s) => {
    const matchCat = activeCategory === 'ALL' || s.category === activeCategory
    const matchSearch =
      search === '' ||
      s.title.toLowerCase().includes(search.toLowerCase())
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
    <div className="flex gap-5">
      <div className="w-52 shrink-0">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </p>
        <div className="space-y-0.5">
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                activeCategory === key
                  ? 'border-l-2 border-[#E1A62F] bg-primary/5 pl-2.5 text-[#E1A62F] font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{label}</span>
              <span className="text-xs">{countFor(key)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search SOPs..."
              className="h-8 pl-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="sm" className="gap-1.5" onClick={openNew}>
            <Plus className="h-3.5 w-3.5" />
            New SOP
          </Button>
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No SOPs found
          </div>
        )}

        {featured && (
          <div
            className="rounded-xl border border-border bg-background p-5 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => setDetailSOP(featured)}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  CAT_COLOR[featured.category]
                )}
              >
                {CAT_LABEL[featured.category]}
              </span>
              <span className="rounded-full bg-[#E1A62F]/10 px-2 py-0.5 text-[11px] font-semibold text-[#E1A62F]">
                Featured
              </span>
            </div>
            <h2 className="text-lg font-bold mb-1">{featured.title}</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <ListOrdered className="h-3 w-3" />
                {featured.steps.length} steps
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {featured.estimatedMinutes} min
              </span>
              <span>
                Updated{' '}
                {new Date(featured.updatedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <ol className="space-y-1">
              {featured.steps.slice(0, 3).map((s) => (
                <li key={s.step} className="flex gap-2 text-sm">
                  <span className="shrink-0 font-bold text-primary">{s.step}.</span>
                  <span>{s.text}</span>
                </li>
              ))}
              {featured.steps.length > 3 && (
                <li className="text-xs text-muted-foreground pl-5">
                  + {featured.steps.length - 3} more steps
                </li>
              )}
            </ol>
          </div>
        )}

        {grid.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {grid.map((sop) => (
              <div
                key={sop.id}
                className="rounded-xl border border-border bg-background p-4 cursor-pointer hover:shadow-sm transition-shadow relative"
                onClick={() => setDetailSOP(sop)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      CAT_COLOR[sop.category]
                    )}
                  >
                    {CAT_LABEL[sop.category]}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
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
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">{sop.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ListOrdered className="h-3 w-3" />
                    {sop.steps.length} steps
                  </span>
                  <span>
                    {new Date(sop.updatedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!detailSOP} onOpenChange={(o) => !o && setDetailSOP(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {detailSOP && (
            <>
              <SheetHeader className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      CAT_COLOR[detailSOP.category]
                    )}
                  >
                    {CAT_LABEL[detailSOP.category]}
                  </span>
                </div>
                <SheetTitle>{detailSOP.title}</SheetTitle>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ListOrdered className="h-3 w-3" />
                    {detailSOP.steps.length} steps
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {detailSOP.estimatedMinutes} min
                  </span>
                  <span>
                    Updated{' '}
                    {new Date(detailSOP.updatedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </SheetHeader>
              <div className="flex justify-end mb-4">
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
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {s.step}
                    </span>
                    <p className="text-sm leading-relaxed pt-0.5">{s.text}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </SheetContent>
      </Sheet>

      <SOPModal open={modalOpen} onClose={handleModalClose} initial={editSOP} />
    </div>
  )
}
