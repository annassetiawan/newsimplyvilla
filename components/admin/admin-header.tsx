'use client'

import { usePathname } from 'next/navigation'
import { Bell, Moon, Sun, Menu } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

const pageLabels: Record<string, { title: string; parent?: string }> = {
  '/admin': { title: 'Dashboard', parent: 'Platform' },
  '/admin/villas': { title: 'Villas', parent: 'Platform' },
}

export function AdminHeader() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const matchedKey = Object.keys(pageLabels).find(
    (key) => pathname === key || pathname.startsWith(key + '/')
  )
  const page = matchedKey ? pageLabels[matchedKey] : { title: 'SimplyVilla Admin' }

  return (
    <header className="fixed right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur transition-all duration-300 left-0 lg:left-[240px]">
      <div className="flex items-center gap-3">
        {/* Logo — mobile only */}
        <span className="text-sm font-bold lg:hidden">
          SimplyVilla <span className="text-primary">Admin</span>
        </span>

        {/* Breadcrumb — desktop only */}
        <nav className="hidden items-center gap-1.5 text-sm lg:flex">
          <span className="text-primary font-medium">SimplyVilla Admin</span>
          {page.parent && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-muted-foreground">{page.parent}</span>
            </>
          )}
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium">{page.title}</span>
        </nav>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>

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
