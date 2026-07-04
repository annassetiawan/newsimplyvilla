'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/store/sidebar-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UpgradeModal } from '@/components/UpgradeModal'
import { createClient } from '@/lib/supabase/client'
import { SidebarNav } from './sidebar-nav'
import { SidebarProSection, SidebarUpgradeBanner } from './sidebar-pro-section'

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

interface SidebarProps {
  userRole: 'OWNER' | 'STAFF'
  userPermissions: string[]
  userName: string
  userEmail: string
  villaName: string
  isPro: boolean
}

export function Sidebar({
  userRole,
  userPermissions,
  userName,
  userEmail,
  villaName,
  isPro,
}: SidebarProps) {
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; feature: string }>({
    open: false,
    feature: '',
  })

  const canAccess = (key: string) =>
    userRole === 'OWNER' || userPermissions.includes(key)

  function openUpgrade(feature: string) {
    setUpgradeModal({ open: true, feature })
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName ? getInitials(userName) : '?'

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay — hidden from AT; keyboard users dismiss via the close button */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeMobile}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 flex h-full flex-col border-r border-border bg-background transition-all duration-300 ease-in-out',
          'lg:z-40',
          collapsed ? 'lg:w-[64px]' : 'lg:w-[240px]',
          'z-50 w-[280px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Mobile close button */}
        <button
          type="button"
          onClick={closeMobile}
          className="absolute right-3 top-3.5 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          type="button"
          onClick={toggle}
          className="absolute -right-3 top-5 z-50 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>

        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center border-b border-border px-3">
          <div className={cn('flex min-w-0 items-center gap-2.5', collapsed && 'w-full justify-center')}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight">SimplyVilla</p>
                <p className="truncate text-[11px] text-muted-foreground">{villaName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          <SidebarNav
            pathname={pathname}
            collapsed={collapsed}
            canAccess={canAccess}
            onNavigate={closeMobile}
          />

          <SidebarProSection
            pathname={pathname}
            collapsed={collapsed}
            isPro={isPro}
            isOwner={userRole === 'OWNER'}
            canAccess={canAccess}
            onUpgrade={openUpgrade}
          />
        </nav>

        {/* Upgrade banner — only for owner */}
        {!isPro && userRole === 'OWNER' && <SidebarUpgradeBanner collapsed={collapsed} />}

        {/* User area */}
        <div className="shrink-0 border-t border-border p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src="" alt={userName} />
                  <AvatarFallback className="bg-foreground text-[11px] font-semibold text-background">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">{userName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
                    </div>
                    <MoreHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, feature: '' })}
        feature={upgradeModal.feature}
      />
    </TooltipProvider>
  )
}
