'use client'

import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/sidebar-context'

export function PageWaveLoader() {
  const { collapsed } = useSidebar()

  return (
    <div
      className={cn(
        'fixed top-0 right-0 bottom-0 z-30 flex items-center justify-center bg-background',
        'left-0',
        collapsed ? 'lg:left-20' : 'lg:left-64',
      )}
      aria-busy="true"
      aria-label="Loading page"
      role="status"
    >
      <div className="wave-loader" />
    </div>
  )
}
