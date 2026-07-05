'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
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
import { ImagePlus, X, Plus } from 'lucide-react'
import { upsertRoom } from '@/app/actions/rooms'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface RoomFormData {
  id?: string
  code: string
  name: string
  type: string
  capacity: number
  pricePerNight: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE'
  photos?: string[]
}

interface Props {
  open: boolean
  onClose: () => void
  initial?: RoomFormData | null
}

type PhotoItem = { id: string; file?: File; preview: string }

export function RoomModal({ open, onClose, initial }: Props) {
  const [pending, startTransition] = useTransition()
  const [code, setCode] = useState(initial?.code ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState(initial?.type ?? '')
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 2))
  const [price, setPrice] = useState(initial ? String(initial.pricePerNight) : '')
  const [status, setStatus] = useState<RoomFormData['status']>(initial?.status ?? 'AVAILABLE')
  const [photos, setPhotos] = useState<PhotoItem[]>(
    () => (initial?.photos ?? []).map((url) => ({ id: url, preview: url }))
  )
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item?.file) URL.revokeObjectURL(item.preview)
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = 5 - photos.length
    const newItems: PhotoItem[] = files.slice(0, remaining).map((file) => ({
      id: `new-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos((prev) => [...prev, ...newItems])
    e.target.value = ''
  }

  async function uploadPhotos(): Promise<string[]> {
    const supabase = createClient()

    return Promise.all(
      photos.map(async (photo) => {
        if (!photo.file) return photo.preview
        const ext = photo.file.name.split('.').pop() ?? 'jpg'
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('room-photos')
          .upload(path, photo.file, { upsert: false })
        if (uploadError) throw new Error(uploadError.message)
        const { data } = supabase.storage.from('room-photos').getPublicUrl(path)
        return data.publicUrl
      })
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!code.trim() || !name.trim() || !type.trim())
      return setError('Code, name, and type are required')
    const cap = parseInt(capacity)
    const priceNum = parseFloat(price)
    if (isNaN(cap) || cap < 1) return setError('Invalid capacity')
    if (isNaN(priceNum) || priceNum < 0) return setError('Invalid price')

    startTransition(async () => {
      try {
        const photoUrls = await uploadPhotos()
        const result = await upsertRoom({
          id: initial?.id,
          code: code.trim(),
          name: name.trim(),
          type: type.trim(),
          capacity: cap,
          pricePerNight: priceNum,
          status,
          photos: photoUrls,
        })
        if (!result.success) {
          toast.error(result.message ?? 'Gagal menyimpan data kamar.')
          return
        }
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

          {/* Photo upload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Photos</Label>
              <span className="text-[11px] text-muted-foreground">{photos.length}/5</span>
            </div>

            {photos.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
              >
                <ImagePlus className="h-5 w-5" />
                <span>Click to add photos</span>
              </button>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="group relative aspect-square">
                    <img
                      src={photo.preview}
                      alt=""
                      className="h-full w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-800 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFilePick}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-neutral-800 text-white hover:bg-neutral-700"
            >
              {pending ? 'Saving...' : initial ? 'Save changes' : 'Add room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
