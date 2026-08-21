'use client'

import { useActionState } from 'react'
import { Plane, Lock } from 'lucide-react'
import { login } from '@/lib/actions'
import { GlassButton, GlassInput, Field } from '@/components/glass'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="glass glass-blur w-full max-w-sm rounded-2xl p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full btn-gradient">
            <Plane className="h-6 w-6 text-white" aria-hidden />
          </span>
          <div>
            <h1 className="font-heading text-xl font-semibold">Umrah Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your workspace</p>
          </div>
        </div>
        <form action={action} className="flex flex-col gap-4">
          <Field label="Username">
            <GlassInput name="username" autoComplete="username" required placeholder="admin" />
          </Field>
          <Field label="Password">
            <GlassInput name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
          </Field>
          {state?.error && (
            <p className="text-sm text-danger" role="alert">{state.error}</p>
          )}
          <GlassButton type="submit" disabled={pending} className="mt-2 w-full py-2.5">
            <Lock className="h-4 w-4" aria-hidden />
            {pending ? 'Signing in…' : 'Sign In'}
          </GlassButton>
        </form>
        <div className="mt-6 rounded-lg border border-glass-border bg-white/3 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Demo accounts</p>
          <p className="tabular">admin / admin123 &nbsp;·&nbsp; moderator / mod123 &nbsp;·&nbsp; viewer / view123</p>
        </div>
      </div>
    </main>
  )
}
