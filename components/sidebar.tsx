'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Calculator, BookOpen, FileText, Wallet,
  Receipt, TicketCheck, Settings, LogOut, Plane, Menu, X, Moon, Sun, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions'
import { useTheme } from './theme-provider'
import { useSidebar } from './sidebar-context'
import { Toggle } from './glass'
import type { Role } from '@/lib/types'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'moderator', 'viewer'] },
  { href: '/calculator', label: 'Package Calculator', icon: Calculator, roles: ['admin', 'moderator'] },
  { href: '/bookings', label: 'Bookings', icon: BookOpen, roles: ['admin', 'moderator', 'viewer'] },
  { href: '/invoices', label: 'Invoices', icon: FileText, roles: ['admin', 'moderator', 'viewer'] },
  { href: '/accounts', label: 'Accounts', icon: Wallet, roles: ['admin', 'moderator', 'viewer'] },
  { href: '/hotel-vouchers', label: 'Hotel Vouchers', icon: TicketCheck, roles: ['admin', 'moderator', 'viewer'] },
  { href: '/settings', label: 'Master Settings', icon: Settings, roles: ['admin'] },
] as const

export function Sidebar({ role, displayName }: { role: Role; displayName: string }) {
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const { collapsed, setCollapsed } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const items = NAV.filter((n) => (n.roles as readonly string[]).includes(role))

  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  const activePath = pendingHref ?? pathname

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
      {items.map((item) => {
        const active = activePath.startsWith(item.href)
        return (
          <div key={item.href} className="relative">
            {active && (
              <motion.span
                layoutId="active-nav-indicator"
                className="absolute left-0 top-1/2 z-10 h-[22px] w-[3px] -translate-y-1/2 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                aria-hidden
              />
            )}
            <Link
              href={item.href}
              onClick={() => {
                setPendingHref(item.href)
                setOpen(false)
              }}
              className={cn(
                'relative mx-3 flex items-center rounded-lg py-2.5 text-sm transition-all duration-300 ease-in-out',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/4',
                collapsed ? 'px-5' : 'px-3',
              )}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <motion.span
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-lg bg-accent border border-primary/20"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon className="relative h-4 w-4 flex-shrink-0" aria-hidden />
              <span className={cn(
                'relative transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden',
                collapsed ? 'max-w-0 opacity-0 pl-0' : 'max-w-[150px] opacity-100 pl-3'
              )}>
                {item.label}
              </span>
            </Link>
          </div>
        )
      })}
    </nav>
  )

  const shell = (
    <div className="flex h-full flex-col py-5">
      <div className={cn('mb-6 flex items-center transition-all duration-300 ease-in-out', collapsed ? 'pl-[22px]' : 'pl-6')}>
        <div className="flex items-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full btn-gradient flex-shrink-0">
            <Plane className="h-4.5 w-4.5 text-white" aria-hidden />
          </span>
          <div className={cn(
            'transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden',
            collapsed ? 'max-w-0 opacity-0 pl-0' : 'max-w-[150px] opacity-100 pl-2.5'
          )}>
            <p className="font-heading text-sm font-semibold leading-tight">Umrah Dashboard</p>
            <p className="text-[11px] text-muted-foreground">Hajj &amp; Umrah CRM</p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'absolute -right-3 top-[26px] z-50 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-glass-border bg-popover text-muted-foreground shadow-md transition-colors lg:flex',
            'hover:bg-accent hover:text-foreground',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : <ChevronLeft className="h-3.5 w-3.5" aria-hidden />}
        </button>
      </div>
      {nav}
      <div className={cn('mt-auto border-t border-glass-border pt-4 transition-all duration-300', collapsed ? 'px-3' : 'px-6')}>
        <div className={cn('flex items-center justify-between transition-all duration-300', collapsed && 'justify-center')}>
          <div className={cn(
            'transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden',
            collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'
          )}>
            <p className="text-sm font-medium leading-tight">{displayName}</p>
            <p className="text-[11px] capitalize text-muted-foreground mt-0.5">{role}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-lg p-1.5 hover:bg-white/5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </div>
        <form action={logout} className={cn(
          'transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden mt-3',
          collapsed ? 'max-w-0 opacity-0 pointer-events-none mt-0' : 'max-w-[200px] opacity-100'
        )}>
          <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-danger transition-colors cursor-pointer">
            <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="glass glass-blur fixed left-4 top-4 z-50 rounded-lg p-2 lg:hidden"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
      <aside
        className={cn(
          'glass glass-blur fixed inset-y-0 left-0 z-40 border-r border-glass-border transition-[transform,width] duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        {shell}
      </aside>
    </>
  )
}
