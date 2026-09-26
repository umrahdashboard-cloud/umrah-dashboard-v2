'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SettingsBackNav({ className }: { className?: string }) {
  const pathname = usePathname()
  if (pathname === '/settings') return null

  return (
    <Link
      href="/settings"
      className={cn(
        'inline-flex min-h-10 items-center gap-2 rounded-lg px-1 text-sm font-medium text-muted-foreground transition-colors',
        'hover:bg-accent/40 hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      <span>Back to Master Settings</span>
    </Link>
  )
}
