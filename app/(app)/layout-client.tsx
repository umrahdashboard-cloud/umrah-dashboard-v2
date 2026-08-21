'use client'

import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/sidebar-context'

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <main className={cn(
      'min-h-screen px-4 pb-12 pt-16 transition-[padding-left] duration-300',
      'lg:pr-8 lg:pt-8',
      collapsed ? 'lg:pl-24' : 'lg:pl-72',
    )}>
      {children}
    </main>
  )
}
