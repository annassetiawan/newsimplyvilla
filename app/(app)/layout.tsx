import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { SidebarOffset } from '@/components/layout/sidebar-offset'
import { Toaster } from 'sonner'
import { getSessionUser } from '@/lib/getSession'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  return (
    <div className="min-h-screen bg-muted/20">
      <Sidebar userRole={user?.role ?? 'STAFF'} userPermissions={user?.permissions ?? []} />
      <Header />
      <SidebarOffset>
        <main className="mx-auto max-w-[1400px] p-4 lg:p-6">{children}</main>
      </SidebarOffset>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
