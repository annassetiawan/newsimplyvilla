'use client'

import { useState } from 'react'
import { User, Settings, ScrollText, HelpCircle, FileText, LogOut } from 'lucide-react'
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
import { useRouter } from 'next/navigation'

export interface ProfileData {
  id: string
  name: string
  email: string
  position: string
}

interface Props {
  profile: ProfileData
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'activity', label: 'Activity Log', icon: ScrollText },
  { id: 'help', label: 'Help & Contact', icon: HelpCircle },
  { id: 'terms', label: 'Terms & Conditions', icon: FileText },
] as const

type TabId = (typeof TABS)[number]['id']

const ACTIVITY_LOG = [
  { id: 1, ts: '2026-05-06 09:14', action: 'Created reservation for Made Wirawan', module: 'Front Desk' },
  { id: 2, ts: '2026-05-06 08:52', action: 'Updated inventory: Stock In mineral water 600ml ×48', module: 'Inventory' },
  { id: 3, ts: '2026-05-05 16:30', action: 'Added task: Deep clean Heliconia Villa', module: 'Maintenance' },
  { id: 4, ts: '2026-05-05 14:10', action: 'Checked in guest: Wayan Sudira → Room Anggrek', module: 'Front Desk' },
  { id: 5, ts: '2026-05-05 11:22', action: 'Added SOP: Pool Safety Procedures', module: 'SOP' },
  { id: 6, ts: '2026-05-04 17:45', action: 'Recorded expense: Staff salary Rp 15,000,000', module: 'Reports' },
  { id: 7, ts: '2026-05-04 15:00', action: 'Assigned shift: Morning – I Made Susanta', module: 'Schedule' },
  { id: 8, ts: '2026-05-03 10:30', action: 'Marked lost item as claimed: iPhone 14 Pro case', module: 'Front Desk' },
  { id: 9, ts: '2026-05-03 09:15', action: 'Stock Out: Bath Mat ×2', module: 'Inventory' },
  { id: 10, ts: '2026-05-02 14:00', action: 'Updated room status: Frangipani → Available', module: 'Rooms' },
]

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

export function SettingsClient({ profile }: Props) {
  const [tab, setTab] = useState<TabId>('profile')
  const router = useRouter()

  const [profileForm, setProfileForm] = useState({
    name: profile.name,
    email: profile.email,
    phone: '',
  })
  const [profileSaved, setProfileSaved] = useState(false)

  const [prefs, setPrefs] = useState({
    language: 'en',
    timezone: 'Asia/Jakarta',
    dateFormat: 'DD/MM/YYYY',
    theme: 'system',
  })
  const [prefsSaved, setPrefsSaved] = useState(false)

  const [contactForm, setContactForm] = useState({
    name: profile.name,
    email: profile.email,
    subject: '',
    message: '',
  })
  const [contactSent, setContactSent] = useState(false)

  function handleSaveProfile() {
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  function handleSavePrefs() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('simplyvilla_prefs', JSON.stringify(prefs))
    }
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 2000)
  }

  function handleContactSubmit() {
    console.log('Contact form submitted:', contactForm)
    setContactSent(true)
    setContactForm((p) => ({ ...p, subject: '', message: '' }))
    setTimeout(() => setContactSent(false), 3000)
  }

  function handleLogout() {
    router.push('/login')
  }

  return (
    <div className="flex gap-6 min-h-[600px]">
      <div className="w-52 shrink-0 flex flex-col">
        <nav className="flex-1 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                tab === id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>

      <div className="flex-1 min-w-0">
        {tab === 'profile' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Profile</h2>
              <p className="text-sm text-muted-foreground">Your personal account information</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E1A62F] text-xl font-bold text-white">
                {initials(profileForm.name || 'U')}
              </div>
              <Button variant="outline" size="sm">
                Change photo
              </Button>
            </div>
            <div className="space-y-3 max-w-md">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone number</Label>
                <Input
                  placeholder="+62..."
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <Button onClick={handleSaveProfile}>
                {profileSaved ? 'Saved!' : 'Save changes'}
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
        )}

        {tab === 'preferences' && (
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
                      onClick={() => setPrefs((p) => ({ ...p, language: v }))}
                      className={cn(
                        'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                        prefs.language === v
                          ? 'border-primary bg-primary/10 text-primary'
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
                      onClick={() => setPrefs((p) => ({ ...p, dateFormat: f }))}
                      className={cn(
                        'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                        prefs.dateFormat === f
                          ? 'border-primary bg-primary/10 text-primary'
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
                      onClick={() => setPrefs((p) => ({ ...p, theme: t.toLowerCase() }))}
                      className={cn(
                        'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                        prefs.theme === t.toLowerCase()
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleSavePrefs}>
                {prefsSaved ? 'Saved!' : 'Save preferences'}
              </Button>
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Activity Log</h2>
              <p className="text-sm text-muted-foreground">Recent actions in your account</p>
            </div>
            <div className="rounded-xl border border-border divide-y divide-border">
              {ACTIVITY_LOG.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4 px-4 py-3">
                  <div className="shrink-0 text-right min-w-[120px]">
                    <p className="text-xs text-muted-foreground">{entry.ts}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{entry.action}</p>
                    <p className="text-xs text-muted-foreground">{entry.module}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'help' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Help & Contact</h2>
              <p className="text-sm text-muted-foreground">Frequently asked questions and support</p>
            </div>
            <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
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
                  value={contactForm.name}
                  onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  value={contactForm.email}
                  onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  placeholder="What is your issue about?"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea
                  rows={4}
                  placeholder="Describe your issue..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                />
              </div>
              <Button onClick={handleContactSubmit} disabled={contactSent}>
                {contactSent ? 'Message sent!' : 'Send message'}
              </Button>
            </div>
          </div>
        )}

        {tab === 'terms' && (
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
        )}
      </div>
    </div>
  )
}
