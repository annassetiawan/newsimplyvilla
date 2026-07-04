'use client'

import type { Dispatch, SetStateAction } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ProGate } from '@/components/ProGate'

export interface ProfileData {
  id: string
  name: string
  email: string
  position: string
}

export interface ActivityLogEntry {
  id: string
  action: string
  module: string
  staffName: string | null
  createdAt: string
}

export interface VillaFormState {
  name: string
  description: string
  email: string
  phone: string
  address: string
}

export interface ProfileFormState {
  name: string
  email: string
  phone: string
}

export interface PrefsState {
  language: string
  timezone: string
  dateFormat: string
  theme: string
}

export interface ContactFormState {
  name: string
  email: string
  subject: string
  message: string
}

const FAQ = [
  {
    q: 'How do I add a new reservation?',
    a: 'Go to Front Desk → click "+ New reservation" in the top right. Fill in guest name, room, check-in/out dates, and confirm.',
  },
  {
    q: 'How do I record a stock adjustment?',
    a: 'Go to Inventory → use "Stock In" to add units or "Stock Out" to record usage. Each movement is logged with a date and optional note.',
  },
  {
    q: 'How do I assign a maintenance task?',
    a: 'Go to Maintenance → click "+ New task". Select the task type, location, priority, and assign it to a staff member with a due date.',
  },
  {
    q: 'Can I export financial reports?',
    a: 'Yes. Go to Reports → click "Export Excel" in the top right. This generates a .xlsx file with Summary, Transactions, and Expense Breakdown sheets.',
  },
  {
    q: 'How do I add or deactivate a staff member?',
    a: 'Go to Users → click "+ Add staff" to create a new account, or use the ⋯ menu on any staff row to deactivate or reset their password.',
  },
]

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatTs(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).slice(0, 16).replace('T', ' ')
}

// ─── Villa tab ────────────────────────────────────────────────────────────────

interface VillaTabProps {
  form: VillaFormState
  setForm: Dispatch<SetStateAction<VillaFormState>>
  pending: boolean
  onSave: () => void
}

export function VillaTab({ form, setForm, pending, onSave }: VillaTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Villa</h2>
        <p className="text-sm text-muted-foreground">
          Nama dan deskripsi villa akan muncul di halaman landing page publik
        </p>
      </div>
      <div className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label>Nama villa</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
            placeholder="Nama villa..."
          />
          <p className="text-xs text-muted-foreground">
            URL publik: <code className="text-primary">/v/{form.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .replace(/-+/g, '-') || 'villa'}</code>
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Deskripsi</Label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
            placeholder="Deskripsikan villa kamu... (akan muncul di halaman booking)"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
            placeholder="email@villa.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Telepon / WA</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))}
            placeholder="+62..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Alamat</Label>
          <Textarea
            rows={2}
            value={form.address}
            onChange={(e) => setForm((v) => ({ ...v, address: e.target.value }))}
            placeholder="Alamat lengkap villa..."
          />
        </div>
        <Button onClick={onSave} disabled={pending}>
          {pending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </div>
  )
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

interface ProfileTabProps {
  form: ProfileFormState
  setForm: Dispatch<SetStateAction<ProfileFormState>>
  saved: boolean
  onSave: () => void
}

export function ProfileTab({ form, setForm, saved, onSave }: ProfileTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">Your personal account information</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E1A62F] text-xl font-bold text-white">
          {initials(form.name || 'U')}
        </div>
        <Button variant="outline" size="sm">
          Change photo
        </Button>
      </div>
      <div className="space-y-3 max-w-md">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone number</Label>
          <Input
            placeholder="+62..."
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>
        <Button onClick={onSave}>
          {saved ? 'Saved!' : 'Save changes'}
        </Button>
      </div>
      <div className="border-t border-border pt-5 max-w-md space-y-3">
        <h3 className="text-sm font-semibold">Change password</h3>
        <div className="space-y-1.5">
          <Label>Current password</Label>
          <Input type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-1.5">
          <Label>New password</Label>
          <Input type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-1.5">
          <Label>Confirm new password</Label>
          <Input type="password" placeholder="••••••••" />
        </div>
        <Button variant="outline">Update password</Button>
      </div>
    </div>
  )
}

// ─── Preferences tab ──────────────────────────────────────────────────────────

interface PreferencesTabProps {
  prefs: PrefsState
  setPrefs: Dispatch<SetStateAction<PrefsState>>
  saved: boolean
  onSave: () => void
}

export function PreferencesTab({ prefs, setPrefs, saved, onSave }: PreferencesTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Preferences</h2>
        <p className="text-sm text-muted-foreground">Customize your experience</p>
      </div>
      <div className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label>Language</Label>
          <div className="flex gap-2">
            {[{ v: 'id', l: 'Indonesia' }, { v: 'en', l: 'English' }].map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, language: v }))}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  prefs.language === v
                    ? 'border-border bg-muted text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Timezone</Label>
          <Select
            value={prefs.timezone}
            onValueChange={(v) => setPrefs((p) => ({ ...p, timezone: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Jakarta">WIB – Jakarta (UTC+7)</SelectItem>
              <SelectItem value="Asia/Makassar">WITA – Makassar (UTC+8)</SelectItem>
              <SelectItem value="Asia/Jayapura">WIT – Jayapura (UTC+9)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Date format</Label>
          <div className="flex gap-2">
            {['DD/MM/YYYY', 'MM/DD/YYYY'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, dateFormat: f }))}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  prefs.dateFormat === f
                    ? 'border-border bg-muted text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Theme</Label>
          <div className="flex gap-2">
            {['Light', 'Dark', 'System'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, theme: t.toLowerCase() }))}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  prefs.theme === t.toLowerCase()
                    ? 'border-border bg-muted text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={onSave}>
          {saved ? 'Saved!' : 'Save preferences'}
        </Button>
      </div>
    </div>
  )
}

// ─── Activity tab ─────────────────────────────────────────────────────────────

export function ActivityTab({ activityLog }: { activityLog: ActivityLogEntry[] }) {
  return (
    <ProGate feature="Activity Log" description="Lihat histori semua aksi dan perubahan yang terjadi di villa kamu.">
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Activity Log</h2>
          <p className="text-sm text-muted-foreground">Recent actions in your account</p>
        </div>
        {activityLog.length === 0 ? (
          <div className="rounded-xl border border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No activity recorded yet.
          </div>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border">
            {activityLog.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 px-4 py-3">
                <div className="shrink-0 text-right min-w-[130px]">
                  <p className="text-xs text-muted-foreground">{formatTs(entry.createdAt)}</p>
                  {entry.staffName && (
                    <p className="text-xs text-muted-foreground/60">{entry.staffName}</p>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">{entry.module}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProGate>
  )
}

// ─── Help tab ─────────────────────────────────────────────────────────────────

interface HelpTabProps {
  form: ContactFormState
  setForm: Dispatch<SetStateAction<ContactFormState>>
  sent: boolean
  onSubmit: () => void
}

export function HelpTab({ form, setForm, sent, onSubmit }: HelpTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Help & Contact</h2>
        <p className="text-sm text-muted-foreground">Frequently asked questions and support</p>
      </div>
      <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
        {FAQ.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger className="text-sm font-medium text-left">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="space-y-3 max-w-md border-t border-border pt-5">
        <h3 className="text-sm font-semibold">Contact support</h3>
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Subject</Label>
          <Input
            placeholder="What is your issue about?"
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Message</Label>
          <Textarea
            rows={4}
            placeholder="Describe your issue..."
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          />
        </div>
        <Button onClick={onSubmit} disabled={sent}>
          {sent ? 'Message sent!' : 'Send message'}
        </Button>
      </div>
    </div>
  )
}

// ─── Terms tab ────────────────────────────────────────────────────────────────

export function TermsTab() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold">Terms & Conditions</h2>
        <p className="text-xs text-muted-foreground">Last updated: 1 May 2026</p>
      </div>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          Welcome to SimplyVilla, a villa management platform designed to help property
          operators manage reservations, staff, inventory, and operations in one place.
        </p>
        <div>
          <h3 className="font-semibold text-foreground mb-1">1. Acceptance of Terms</h3>
          <p>
            By accessing or using SimplyVilla, you agree to be bound by these Terms and
            Conditions. If you do not agree, you may not use the platform.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">2. Use of Service</h3>
          <p>
            SimplyVilla is provided for lawful business use. You agree not to misuse the
            platform, attempt unauthorized access, or use it to store unlawful content. You are
            responsible for maintaining the security of your account credentials.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">3. Data & Privacy</h3>
          <p>
            We store guest, reservation, and operational data on your behalf. This data is
            processed in accordance with our Privacy Policy. We do not sell your data to third
            parties.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">4. Limitation of Liability</h3>
          <p>
            SimplyVilla is provided &quot;as is&quot; without warranty of any kind. We are not liable
            for any indirect, incidental, or consequential damages arising from your use of the
            platform.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">5. Changes to Terms</h3>
          <p>
            We may update these Terms at any time. Continued use of the platform after changes
            constitutes acceptance of the new Terms.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">6. Contact</h3>
          <p>
            For questions about these Terms, contact us via the Help & Contact tab or email
            support@simplyvilla.app.
          </p>
        </div>
      </div>
    </div>
  )
}
