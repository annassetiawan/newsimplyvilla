'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (url: string) => void
}

const BUCKET = 'business-items'
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function uniquePath(file: File) {
  const ext = file.name.split('.').pop() ?? 'jpg'
  return `items/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
}

export function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast.error('Format tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Ukuran file maksimal 5 MB.')
      return
    }

    // Show local preview immediately while uploading
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)

    try {
      const supabase = createClient()
      const path = uniquePath(file)

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      onChange(data.publicUrl)
    } catch (err) {
      toast.error('Gagal upload foto. Coba lagi.')
      setPreview(null)
      onChange('')
    } finally {
      setUploading(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    setPreview(null)
    onChange('')
  }

  const displaySrc = preview ?? value

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        className="hidden"
        onChange={handleInputChange}
      />

      {displaySrc ? (
        // Preview with remove button
        <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-border">
          <Image
            src={displaySrc}
            alt="Item photo"
            fill
            className="object-cover"
            sizes="128px"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Loader2 className="h-5 w-5 animate-spin text-foreground" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground shadow transition-colors hover:bg-background"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground shadow transition-colors hover:bg-background"
            disabled={uploading}
          >
            <ImagePlus className="h-3 w-3" />
          </button>
        </div>
      ) : (
        // Drop zone
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            'flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors',
            'hover:border-neutral-400 hover:bg-muted/50'
          )}
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-[11px] font-medium">Upload foto</span>
          <span className="text-[10px]">maks. 5 MB</span>
        </button>
      )}
    </div>
  )
}
