import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { getSessionUser } from '@/lib/getSession'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()

  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminSidebar userName={user.name} userEmail={user.email ?? ''} />
      <AdminHeader />
      <div className="lg:pl-[240px]">
        <main className="mx-auto max-w-[1400px] p-4 pt-[72px] lg:p-6 lg:pt-[72px]">{children}</main>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
