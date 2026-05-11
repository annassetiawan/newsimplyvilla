'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarStore {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (value: boolean) => void
  mobileOpen: boolean
  openMobile: () => void
  closeMobile: () => void
}

export const useSidebar = create<SidebarStore>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (value) => set({ collapsed: value }),
      mobileOpen: false,
      openMobile: () => set({ mobileOpen: true }),
      closeMobile: () => set({ mobileOpen: false }),
    }),
    {
      name: 'sidebar-state',
      partialize: (state) => ({ collapsed: state.collapsed }),
    }
  )
)
