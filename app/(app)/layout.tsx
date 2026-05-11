import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { SidebarOffset } from '@/components/layout/sidebar-offset'
import { Toaster } from 'sonner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <Sidebar />
      <Header />
      <SidebarOffset>
        <main className="mx-auto max-w-[1400px] p-6">{children}</main>
      </SidebarOffset>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
