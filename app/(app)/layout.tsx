import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { SidebarOffset } from '@/components/layout/sidebar-offset'
import { Toaster } from 'sonner'
import { getSessionUser } from '@/lib/getSession'

async function SidebarServer() {
  const user = await getSessionUser()
  const sub = user?.villa?.subscription
  const isPro = sub?.plan === 'PRO' && sub?.status === 'ACTIVE'
  return (
    <Sidebar
      userRole={user?.role ?? 'STAFF'}
      userPermissions={user?.permissions ?? []}
      userName={user?.name ?? ''}
      userEmail={user?.email ?? ''}
      villaName={user?.villa?.name ?? 'SimplyVilla'}
      isPro={isPro}
    />
  )
}

function SidebarFallback() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-[240px] flex-col border-r border-border bg-background lg:flex">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-3">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-primary/30" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-28 animate-pulse rounded bg-muted" />
        </div>
      </div>
      {/* Nav items */}
      <nav className="flex-1 overflow-hidden py-3">
        {[
          { label: true, items: 1 },
          { label: true, items: 5 },
          { label: true, items: 2 },
          { label: true, items: 2 },
        ].map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            <div className="mb-1 px-4">
              <div className="h-2 w-16 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-0.5 px-2">
              {Array.from({ length: group.items }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                  <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>
      {/* Footer */}
      <div className="shrink-0 border-t border-border p-2">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-5 w-5 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </aside>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <Suspense fallback={<SidebarFallback />}>
        <SidebarServer />
      </Suspense>
      <Header />
      <SidebarOffset>
        <main className="mx-auto max-w-[1400px] p-4 lg:p-6">{children}</main>
      </SidebarOffset>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
