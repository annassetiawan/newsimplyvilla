'use client'

import { cn } from '@/lib/utils'
import { useSidebar } from '@/store/sidebar-store'

export function SidebarOffset({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div
      className={cn(
        'pt-14 transition-all duration-300 ease-in-out',
        'pl-0',
        collapsed ? 'lg:pl-[64px]' : 'lg:pl-[240px]'
      )}
    >
      {children}
    </div>
  )
}
