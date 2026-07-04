'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronLeft, FileText, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { updateGuestNotes } from '@/app/actions/guests'
import {
  CurrentStayCard,
  GuestIdentityCard,
  GuestStaysList,
  StayHistoryCard,
  memberSince,
  ordinalStay,
  type GuestDetail,
} from './guest-detail-cards'

interface Props {
  guest: GuestDetail
}

interface NotesCardProps {
  notes: string
  value: string
  editing: boolean
  pending: boolean
  onChange: (v: string) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

function NotesCard({ notes, value, editing, pending, onChange, onEdit, onSave, onCancel }: NotesCardProps) {
  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Preferences &amp; Notes</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
      </div>
      <p className="mb-4 text-xs text-muted-foreground">Internal notes visible only to staff</p>

      {editing ? (
        <div className="space-y-3">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Add preferences, allergies, special requests..."
            rows={5}
            className="resize-none text-sm"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onSave} disabled={pending}>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              {pending ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} disabled={pending}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      ) : notes ? (
        <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground italic leading-relaxed">
          {notes}
        </p>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="w-full rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/30 hover:text-foreground"
        >
          + Add notes for this guest
        </button>
      )}
    </div>
  )
}

export function GuestDetailClient({ guest }: Props) {
  const [activeTab, setActiveTab] = useState('overview')
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(guest.notes ?? '')
  const [savedNotes, setSavedNotes] = useState(guest.notes ?? '')
  const [notesPending, startNotesTrans] = useTransition()

  function handleSaveNotes() {
    startNotesTrans(async () => {
      await updateGuestNotes(guest.id, notesValue)
      setSavedNotes(notesValue)
      setEditingNotes(false)
    })
  }

  function handleCancelNotes() {
    setNotesValue(savedNotes)
    setEditingNotes(false)
  }

  const validStays = guest.reservations.filter((r) => r.status !== 'CANCELLED')
  const currentStay = guest.reservations.find(
    (r) => r.status === 'CHECKEDIN' || r.status === 'CONFIRMED'
  ) ?? null
  const ltv = validStays.reduce((sum, r) => sum + r.totalAmount, 0)

  const stayCount = validStays.length

  const notesCard = (
    <NotesCard
      notes={savedNotes}
      value={notesValue}
      editing={editingNotes}
      pending={notesPending}
      onChange={setNotesValue}
      onEdit={() => setEditingNotes(true)}
      onSave={handleSaveNotes}
      onCancel={handleCancelNotes}
    />
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link
          href="/front-desk"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Front Desk
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{guest.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {stayCount > 0 ? `${ordinalStay(stayCount)} visit` : 'New guest'}
              {' · '}Member since {memberSince(guest.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/front-desk">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stays">Stays</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            {/* Left column */}
            <div className="space-y-4">
              <GuestIdentityCard guest={guest} stayCount={stayCount} />
              {notesCard}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <CurrentStayCard currentStay={currentStay} />
              <StayHistoryCard
                reservations={guest.reservations}
                stayCount={stayCount}
                ltv={ltv}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Stays ── */}
        <TabsContent value="stays" className="mt-5">
          <GuestStaysList reservations={guest.reservations} />
        </TabsContent>

        {/* ── Notes ── */}
        <TabsContent value="notes" className="mt-5">
          {notesCard}
        </TabsContent>
      </Tabs>
    </div>
  )
}
