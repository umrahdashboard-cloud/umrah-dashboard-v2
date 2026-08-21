import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/sidebar'
import { ToastProvider } from '@/components/toast'
import { SidebarProvider } from '@/components/sidebar-context'
import { AppLayoutClient } from './layout-client'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <SidebarProvider>
      <ToastProvider>
        <div className="min-h-screen">
          <Sidebar role={session.role} displayName={session.displayName} />
          <AppLayoutClient>
            {children}
          </AppLayoutClient>
        </div>
      </ToastProvider>
    </SidebarProvider>
  )
}
