'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createLostAndFound, claimLostAndFound } from '@/app/actions/reservations'

export interface LostFoundItem {
  id: string
  item: string
  description: string | null
  location: string
  foundDate: string
  status: 'FOUND' | 'CLAIMED'
}

interface Props {
  items: LostFoundItem[]
}

export function LostFoundTab({ items }: Props) {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [foundDate, setFoundDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )

  const filtered = items.filter(
    (i) => statusFilter === 'ALL' || i.status === statusFilter
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemName.trim() || !location.trim()) return
    startTransition(async () => {
      await createLostAndFound({
        item: itemName.trim(),
        description: description || undefined,
        location: location.trim(),
        foundDate: new Date(foundDate),
      })
      setItemName('')
      setDescription('')
      setLocation('')
      setFoundDate(new Date().toISOString().split('T')[0])
      setModalOpen(false)
    })
  }

  function handleClaim(id: string) {
    startTransition(async () => {
      await claimLostAndFound(id)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All items</SelectItem>
            <SelectItem value="FOUND">Found</SelectItem>
            <SelectItem value="CLAIMED">Claimed</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="ml-auto h-8 bg-primary text-white hover:bg-[#C8911A]"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New item
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Date found</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No items found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.item}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.description ?? '—'}
                </TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell>
                  {new Date(item.foundDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      item.status === 'FOUND'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    )}
                  >
                    {item.status === 'FOUND' ? 'Found' : 'Claimed'}
                  </span>
                </TableCell>
                <TableCell>
                  {item.status === 'FOUND' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={pending}
                      onClick={() => handleClaim(item.id)}
                    >
                      Mark claimed
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New lost &amp; found item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Item name</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Black umbrella"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location found</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Room FR-03"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date found</Label>
              <Input
                type="date"
                value={foundDate}
                onChange={(e) => setFoundDate(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Saving...' : 'Save item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
