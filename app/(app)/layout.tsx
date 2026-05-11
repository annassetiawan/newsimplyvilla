import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { SidebarOffset } from '@/components/layout/sidebar-offset'
import { Toaster } from 'sonner'
import { getSessionUser } from '@/lib/getSession'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  const sub = user?.villa?.subscription
  const isPro = sub?.plan === 'PRO' && sub?.status === 'ACTIVE'
  return (
    <div className="min-h-screen bg-muted/20">
      <Sidebar
        userRole={user?.role ?? 'STAFF'}
        userPermissions={user?.permissions ?? []}
        userName={user?.name ?? ''}
        userEmail={user?.email ?? ''}
        villaName={user?.villa?.name ?? 'SimplyVilla'}
        isPro={isPro}
      />
      <Header />
      <SidebarOffset>
        <main className="mx-auto max-w-[1400px] p-4 lg:p-6">{children}</main>
      </SidebarOffset>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
