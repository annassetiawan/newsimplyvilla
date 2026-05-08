import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/getSession'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { SidebarOffset } from '@/components/layout/sidebar-offset'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (!user.villa.isOnboarded) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-muted/20">
      <Sidebar />
      <Header />
      <SidebarOffset>
        <main className="mx-auto max-w-[1400px] p-6">{children}</main>
      </SidebarOffset>
    </div>
  )
}
