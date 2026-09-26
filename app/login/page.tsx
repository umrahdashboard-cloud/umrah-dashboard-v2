'use client'

import { useActionState } from 'react'
import { ArrowRight, Eye, PenLine, Shield } from 'lucide-react'
import { login } from '@/lib/actions'
import { cn } from '@/lib/utils'

const DEMO_ROLES = [
  {
    role: 'Admin',
    description: 'Settings, users, and full module access',
    username: 'admin',
    password: 'admin123',
    icon: Shield,
  },
  {
    role: 'Moderator',
    description: 'Bookings, invoices, vouchers, and payments',
    username: 'moderator',
    password: 'mod123',
    icon: PenLine,
  },
  {
    role: 'Viewer',
    description: 'Read-only access to records and reports',
    username: 'viewer',
    password: 'view123',
    icon: Eye,
  },
] as const

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/60 bg-card p-0 shadow-md">
            <img src="/logo-crm.png" alt="Umrah Dashboard" className="h-full w-full object-contain" />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Umrah Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Client demo — select a role to continue
          </p>
        </div>

        <div className="rounded-2xl border border-glass-border bg-card p-5 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Demo access
          </p>

          <div className="flex flex-col gap-2">
            {DEMO_ROLES.map(({ role, description, username, password, icon: Icon }) => (
              <form key={username} action={action}>
                <input type="hidden" name="username" value={username} />
                <input type="hidden" name="password" value={password} />
                <button
                  type="submit"
                  disabled={pending}
                  className={cn(
                    'group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-glass-border bg-background/40 px-4 py-3.5 text-left transition-colors',
                    'hover:border-primary/40 hover:bg-accent/30',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'disabled:pointer-events-none disabled:opacity-60',
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{role}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden
                  />
                </button>
              </form>
            ))}
          </div>

          {pending && (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Signing in…
            </p>
          )}

          {state?.error && (
            <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-center text-sm text-danger" role="alert">
              {state.error}
            </p>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Sample data only · No registration required
        </p>
      </div>
    </main>
  )
}
