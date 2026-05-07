'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ConciergeBell,
  BedDouble,
  Package,
  Wrench,
  Calendar,
  BarChart3,
  BookOpen,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
  Lock,
  Wallet,
  UserCheck,
  Globe,
  GitBranch,
  TrendingUp,
  Crown,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/store/sidebar-store'
import { useSubscription } from '@/hooks/useSubscription'
import { useUser } from '@/hooks/useUser'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UpgradeModal } from '@/components/UpgradeModal'
import { createClient } from '@/lib/supabase/client'

const navGroups = [
  {
    label: 'OVERVIEW',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'OPERATIONS',
    items: [
      { label: 'Front Desk', href: '/front-desk', icon: ConciergeBell },
      { label: 'Rooms & Areas', href: '/rooms', icon: BedDouble },
      { label: 'Inventory', href: '/inventory', icon: Package },
      { label: 'Maintenance', href: '/maintenance', icon: Wrench },
      { label: 'Schedule', href: '/schedule', icon: Calendar },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { label: 'Reports', href: '/reports', icon: BarChart3 },
      { label: 'SOP', href: '/sop', icon: BookOpen },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'Users', href: '/users', icon: Users },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

const proFeatures = [
  { label: 'Business', href: '/business', icon: TrendingUp },
  { label: 'Finance & Account', href: '/finance', icon: Wallet },
  { label: 'User Management', href: '/users', icon: Users },
  { label: 'Employee Management', href: '/employee', icon: UserCheck },
  { label: 'Channel Manager', href: '/channel-manager', icon: Globe },
  { label: 'Change Management', href: '/change-management', icon: GitBranch },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function Sidebar() {
  const { collapsed, toggle } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const { isPro } = useSubscription()
  const { user, isLoading: userLoading } = useUser()
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; feature: string }>({
    open: false,
    feature: '',
  })

  function openUpgrade(feature: string) {
    setUpgradeModal({ open: true, feature })
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = userLoading ? '…' : (user?.name ?? 'User')
  const displayEmail = userLoading ? '' : (user?.email ?? '')
  const displayVilla = userLoading ? 'SimplyVilla' : (user?.villaName ?? 'SimplyVilla')
  const initials = userLoading ? '?' : (user ? getInitials(user.name) : '?')

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border bg-background transition-all duration-300 ease-in-out',
          collapsed ? 'w-[64px]' : 'w-[240px]'
        )}
      >
        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className="absolute -right-3 top-5 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
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
                <p className="truncate text-[11px] text-muted-foreground">{displayVilla}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navGroups.map((group, groupIdx) => (
            <div key={group.label} className={cn(groupIdx > 0 && 'mt-4')}>
              {!collapsed && (
                <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              {collapsed && groupIdx > 0 && (
                <div className="mx-3 mb-3 mt-1 h-px bg-border" />
              )}
              <div className="space-y-0.5 px-2">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon

                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-muted text-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            collapsed && 'justify-center px-2'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          ))}

          {/* PRO FEATURES */}
          <div className="mt-4">
            {!collapsed && (
              <div className="mb-1 flex items-center gap-2 px-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Pro Features
                </p>
              </div>
            )}
            {collapsed && <div className="mx-3 mb-3 mt-1 h-px bg-border" />}
            <div className="space-y-0.5 px-2">
              {proFeatures.map((item) => {
                const Icon = item.icon
                const isActive =
                  isPro && (pathname === item.href || pathname.startsWith(item.href + '/'))

                if (isPro) {
                  return (
                    <Tooltip key={item.label}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-muted text-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            collapsed && 'justify-center px-2'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                }

                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => openUpgrade(item.label)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                          'cursor-pointer text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground',
                          collapsed && 'justify-center px-2'
                        )}
                      >
                        <Lock className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate text-left">{item.label}</span>
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                              style={{ background: '#E1A62F22', color: '#E1A62F' }}
                            >
                              PRO
                            </span>
                          </>
                        )}
                      </button>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="font-medium">
                        {item.label}{' '}
                        <span className="ml-1 text-[10px] font-bold text-[#E1A62F]">PRO</span>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Upgrade banner */}
        {!isPro && (
          <div className="shrink-0 px-2 pb-2">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/pricing"
                    className="flex h-9 w-full items-center justify-center rounded-lg border border-[#E1A62F33] bg-[#E1A62F0D] text-[#E1A62F] transition-colors hover:bg-[#E1A62F1A]"
                  >
                    <Crown className="h-4 w-4 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Upgrade ke Pro
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-2.5 rounded-lg bg-[#E1A62F0D] px-3 py-2.5">
                <Crown className="h-4 w-4 shrink-0 text-[#E1A62F]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-tight text-foreground">
                    Upgrade ke Pro
                  </p>
                  <p className="text-[11px] text-muted-foreground">Unlock 6 fitur eksklusif</p>
                </div>
                <Link
                  href="/pricing"
                  className="shrink-0 rounded-md border border-[#E1A62F] px-2.5 py-1 text-[11px] font-semibold text-[#E1A62F] transition-colors hover:bg-[#E1A62F] hover:text-white"
                >
                  Upgrade
                </Link>
              </div>
            )}
          </div>
        )}

        {/* User area */}
        <div className="shrink-0 border-t border-border p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src="" alt={displayName} />
                  <AvatarFallback className="bg-foreground text-[11px] font-semibold text-background">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{displayEmail}</p>
                    </div>
                    <MoreHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{displayEmail}</p>
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
