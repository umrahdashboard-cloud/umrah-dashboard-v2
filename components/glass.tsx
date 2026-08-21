'use client'

import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function GlassCard({
  children, className, blur = false,
}: { children: ReactNode; className?: string; blur?: boolean }) {
  return (
    <div className={cn('glass rounded-xl', blur && 'glass-blur', className)}>
      {children}
    </div>
  )
}

export function GlassButton({
  variant = 'primary', className, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
        variant === 'primary' && 'btn-gradient text-primary-foreground',
        variant === 'secondary' && 'glass text-foreground hover:bg-white/8',
        variant === 'destructive' && 'bg-danger text-white hover:bg-danger/85',
        variant === 'ghost' && 'text-muted-foreground hover:text-foreground hover:bg-white/5',
        className,
      )}
    />
  )
}

export function GlassInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-lg bg-input border border-glass-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring tabular',
        className,
      )}
    />
  )
}

export function GlassTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full rounded-lg bg-input border border-glass-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring',
        className,
      )}
    />
  )
}

export function GlassSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full cursor-pointer rounded-lg border border-glass-border bg-input px-3 py-2 text-sm text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        'scheme-dark [.light_&]:scheme-light',
        '[&>option]:bg-popover [&>option]:text-popover-foreground',
        className,
      )}
    >
      {children}
    </select>
  )
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

export function Toggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer overflow-hidden',
        checked ? 'btn-gradient' : 'bg-slate-200 dark:bg-white/10',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

export function StatusPill({ status }: { status: 'paid' | 'partial' | 'unpaid' }) {
  const map = {
    paid: 'bg-success/15 text-success border-success/30',
    partial: 'bg-warning/15 text-warning border-warning/30',
    unpaid: 'bg-danger/15 text-danger border-danger/30',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', map[status])}>
      {status}
    </span>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-balance">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
