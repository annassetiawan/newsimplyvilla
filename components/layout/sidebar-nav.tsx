'use client'

import Link from 'next/link'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const navGroups = [
  {
    label: 'OVERVIEW',
    items: [{ label: 'Dashboard', href: '/dashboard', key: 'dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'OPERATIONS',
    items: [
      { label: 'Front Desk', href: '/front-desk', key: 'front-desk', icon: ConciergeBell },
      { label: 'Rooms & Areas', href: '/rooms', key: 'rooms', icon: BedDouble },
      { label: 'Inventory', href: '/inventory', key: 'inventory', icon: Package },
      { label: 'Maintenance', href: '/maintenance', key: 'maintenance', icon: Wrench },
      { label: 'Schedule', href: '/schedule', key: 'schedule', icon: Calendar },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { label: 'Reports', href: '/reports', key: 'reports', icon: BarChart3 },
      { label: 'SOP', href: '/sop', key: 'sop', icon: BookOpen },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'Users', href: '/users', key: 'users', icon: Users },
      { label: 'Settings', href: '/settings', key: 'settings', icon: Settings },
    ],
  },
]

interface SidebarNavProps {
  pathname: string
  collapsed: boolean
  canAccess: (key: string) => boolean
  onNavigate: () => void
}

export function SidebarNav({ pathname, collapsed, canAccess, onNavigate }: SidebarNavProps) {
  return (
    <>
      {navGroups.map((group, groupIdx) => {
        const visibleItems = group.items.filter((item) => canAccess(item.key))
        if (visibleItems.length === 0) return null
        return (
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
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
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
        )
      })}
    </>
  )
}
