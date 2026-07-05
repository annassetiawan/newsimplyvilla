'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Users,
  Shield,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Villas', href: '/admin/villas', icon: Users },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

interface AdminSidebarProps {
  userName: string
  userEmail: string
}

export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName ? getInitials(userName) : 'SA'

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-[240px] flex-col border-r border-border bg-background lg:flex">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight">SimplyVilla</p>
          <p className="truncate text-[11px] text-primary font-medium">Super Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <div>
          <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Platform
          </p>
          <div className="space-y-0.5 px-2">
            {adminNavItems.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-light text-primary dark:bg-primary/20 dark:text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* User area */}
      <div className="shrink-0 border-t border-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">{userName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
              </div>
              <MoreHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
              <p className="mt-1 inline-flex items-center rounded bg-primary-light px-1.5 py-0.5 text-[10px] font-semibold text-primary dark:bg-primary/20 dark:text-primary">
                Super Admin
              </p>
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
  )
}
