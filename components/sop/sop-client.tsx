'use client'

import { useState, useTransition } from 'react'
import { Search, Plus, X, BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteSOP } from '@/app/actions/sop'
import { SOPModal } from './sop-modal'
import {
  SOPCategoryFilter,
  SOPDetailDialog,
  SOPFeaturedCard,
  SOPGridCard,
  formatSOPDate,
  type SOPData,
} from './sop-cards'

export type { SOPData }

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
    ? formatSOPDate(
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
                type="button"
                aria-label="Close search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => { setSearch(''); setSearchOpen(false) }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
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
        <SOPCategoryFilter
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          countFor={countFor}
        />

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

          {featured && (
            <SOPFeaturedCard sop={featured} onOpen={() => setDetailSOP(featured)} />
          )}

          {grid.length > 0 && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {grid.map((sop) => (
                <SOPGridCard
                  key={sop.id}
                  sop={sop}
                  pending={pending}
                  onOpen={() => setDetailSOP(sop)}
                  onEdit={() => openEdit(sop)}
                  onDelete={() => handleDelete(sop.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <SOPDetailDialog
        sop={detailSOP}
        onClose={() => setDetailSOP(null)}
        onEdit={(sop) => {
          setDetailSOP(null)
          openEdit(sop)
        }}
      />

      <SOPModal open={modalOpen} onClose={handleModalClose} initial={editSOP} />
    </div>
  )
}
