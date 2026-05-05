'use client'

import { usePathname } from 'next/navigation'
import { Bell, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/store/sidebar-store'
import { Button } from '@/components/ui/button'

const pageLabels: Record<string, { title: string; parent?: string }> = {
  '/dashboard': { title: 'Dashboard' },
  '/front-desk': { title: 'Front Desk', parent: 'Operations' },
  '/rooms': { title: 'Rooms & Areas', parent: 'Operations' },
  '/inventory': { title: 'Inventory', parent: 'Operations' },
  '/maintenance': { title: 'Maintenance', parent: 'Operations' },
  '/schedule': { title: 'Schedule', parent: 'Operations' },
  '/reports': { title: 'Reports', parent: 'Insights' },
  '/sop': { title: 'SOP', parent: 'Insights' },
  '/users': { title: 'Users', parent: 'System' },
  '/settings': { title: 'Settings', parent: 'System' },
}

const NOTIFICATION_COUNT = 3

export function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { collapsed } = useSidebar()

  const matchedKey = Object.keys(pageLabels).find(
    (key) => pathname === key || pathname.startsWith(key + '/')
  )
  const page = matchedKey ? pageLabels[matchedKey] : { title: 'SimplyVilla' }

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur transition-all duration-300 ease-in-out',
        collapsed ? 'left-[64px]' : 'left-[240px]'
      )}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">SimplyVilla</span>
        {page.parent && (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-muted-foreground">{page.parent}</span>
          </>
        )}
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium">{page.title}</span>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {NOTIFICATION_COUNT > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {NOTIFICATION_COUNT}
            </span>
          )}
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  )
}
