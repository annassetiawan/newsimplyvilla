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
    <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-border bg-background" />
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
