'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { upsertRoom } from '@/app/actions/rooms'

export interface RoomFormData {
  id?: string
  code: string
  name: string
  type: string
  capacity: number
  pricePerNight: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE'
}

interface Props {
  open: boolean
  onClose: () => void
  initial?: RoomFormData | null
}

export function RoomModal({ open, onClose, initial }: Props) {
  const [pending, startTransition] = useTransition()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [capacity, setCapacity] = useState('2')
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState<RoomFormData['status']>('AVAILABLE')
  const [error, setError] = useState('')

  useEffect(() => {
    if (initial) {
      setCode(initial.code)
      setName(initial.name)
      setType(initial.type)
      setCapacity(String(initial.capacity))
      setPrice(String(initial.pricePerNight))
      setStatus(initial.status)
    } else {
      setCode('')
      setName('')
      setType('')
      setCapacity('2')
      setPrice('')
      setStatus('AVAILABLE')
    }
    setError('')
  }, [initial, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!code.trim() || !name.trim() || !type.trim()) return setError('Code, name, and type are required')
    const cap = parseInt(capacity)
    const priceNum = parseFloat(price)
    if (isNaN(cap) || cap < 1) return setError('Invalid capacity')
    if (isNaN(priceNum) || priceNum < 0) return setError('Invalid price')

    startTransition(async () => {
      try {
        await upsertRoom({
          id: initial?.id,
          code: code.trim(),
          name: name.trim(),
          type: type.trim(),
          capacity: cap,
          pricePerNight: priceNum,
          status,
        })
        onClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to save room')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit room' : 'Add room'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Room code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. FR-07"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as RoomFormData['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="OCCUPIED">Occupied</SelectItem>
                  <SelectItem value="CLEANING">Cleaning</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Room name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jungle Villa Suite"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Room type</Label>
            <Input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g. Deluxe Villa, Family Suite"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Capacity (pax)</Label>
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Price / night (Rp)</Label>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 2400000"
              />
            </div>
          </div>

          {/* Photo upload placeholder */}
          <div className="space-y-1.5">
            <Label>Photos</Label>
            <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
              Photo upload coming soon
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : initial ? 'Save changes' : 'Add room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
