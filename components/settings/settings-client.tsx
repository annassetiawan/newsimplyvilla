'use client'

import { useState, useTransition } from 'react'
import { User, Settings, ScrollText, HelpCircle, FileText, LogOut, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { updateVillaProfile } from '@/app/actions/settings'
import { toast } from 'sonner'
import {
  ActivityTab,
  HelpTab,
  PreferencesTab,
  ProfileTab,
  TermsTab,
  VillaTab,
  type ActivityLogEntry,
  type ProfileData,
} from './settings-tabs'

export type { ActivityLogEntry, ProfileData }

interface VillaData {
  name: string
  description: string | null
  email: string | null
  phone: string | null
  address: string | null
}

interface Props {
  profile: ProfileData
  activityLog: ActivityLogEntry[]
  villa: VillaData
}

const TABS = [
  { id: 'villa', label: 'Villa', icon: Building2 },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'activity', label: 'Activity Log', icon: ScrollText },
  { id: 'help', label: 'Help & Contact', icon: HelpCircle },
  { id: 'terms', label: 'Terms & Conditions', icon: FileText },
] as const

type TabId = (typeof TABS)[number]['id']

export function SettingsClient({ profile, activityLog, villa }: Props) {
  const [tab, setTab] = useState<TabId>('profile')
  const router = useRouter()

  // Form state lives here so unsaved edits survive tab switches
  const [villaPending, startVillaTransition] = useTransition()
  const [villaForm, setVillaForm] = useState({
    name: villa.name,
    description: villa.description ?? '',
    email: villa.email ?? '',
    phone: villa.phone ?? '',
    address: villa.address ?? '',
  })

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

  function handleSaveVilla() {
    startVillaTransition(async () => {
      const result = await updateVillaProfile({
        name: villaForm.name,
        description: villaForm.description || undefined,
        email: villaForm.email || undefined,
        phone: villaForm.phone || undefined,
        address: villaForm.address || undefined,
      })
      if (result.success) {
        toast.success('Profil villa tersimpan!')
      } else {
        toast.error(result.message ?? 'Gagal menyimpan profil villa.')
      }
    })
  }

  function handleSaveProfile() {
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  function handleSavePrefs() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('simplyvilla_prefs:v1', JSON.stringify(prefs))
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
    <div className="flex flex-col gap-4 lg:min-h-[600px] lg:flex-row lg:gap-6">
      {/* Mobile: horizontal scrollable tabs */}
      <div className="scrollbar-hide flex overflow-x-auto gap-1 border-b border-border pb-1 lg:hidden">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === id
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden w-52 shrink-0 flex-col lg:flex">
        <nav className="flex-1 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                tab === id
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>

      <div className="flex-1 min-w-0">
        {tab === 'villa' && (
          <VillaTab
            form={villaForm}
            setForm={setVillaForm}
            pending={villaPending}
            onSave={handleSaveVilla}
          />
        )}

        {tab === 'profile' && (
          <ProfileTab
            form={profileForm}
            setForm={setProfileForm}
            saved={profileSaved}
            onSave={handleSaveProfile}
          />
        )}

        {tab === 'preferences' && (
          <PreferencesTab
            prefs={prefs}
            setPrefs={setPrefs}
            saved={prefsSaved}
            onSave={handleSavePrefs}
          />
        )}

        {tab === 'activity' && <ActivityTab activityLog={activityLog} />}

        {tab === 'help' && (
          <HelpTab
            form={contactForm}
            setForm={setContactForm}
            sent={contactSent}
            onSubmit={handleContactSubmit}
          />
        )}

        {tab === 'terms' && <TermsTab />}
      </div>
    </div>
  )
}
