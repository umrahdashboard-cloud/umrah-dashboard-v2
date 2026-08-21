import Link from 'next/link'
import {
  Plane, Building2, Stamp, Bus, MapPinned, CircleDollarSign, Palette, Users, SwatchBook, HardDrive, TicketCheck, Phone,
} from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { PageHeader } from '@/components/glass'
import { fmt } from '@/lib/currency'

const SECTIONS = [
  { href: '/settings/airlines', icon: Plane, title: 'Airline Registry', desc: 'Ticket prices per airline (adult / child / infant)' },
  { href: '/settings/hotels', icon: Building2, title: 'Hotel Registry', desc: 'Makkah & Madinah hotels with SAR room rates' },
  { href: '/settings/contacts', icon: Phone, title: 'Contacts', desc: 'Hotel & transport phone numbers by city for vouchers' },
  { href: '/settings/visa', icon: Stamp, title: 'Visa Settings', desc: 'Tiered visa rates, child/infant, ziarat flats' },
  { href: '/settings/transport', icon: Bus, title: 'Transport & Rate Matrix', desc: 'Vehicles, routes and the route x vehicle SAR grid' },
  { href: '/settings/ziarat', icon: MapPinned, title: 'Ziarat Master', desc: 'Ziarat sites and per-pax SAR rates' },
  { href: '/settings/exchange', icon: CircleDollarSign, title: 'Exchange Rate', desc: 'SAR to PKR conversion factor used app-wide' },
  { href: '/settings/branding', icon: Palette, title: 'Invoice Branding', desc: 'Bank details, T&Cs, PDF logo layout, signature' },
  { href: '/settings/hotel-voucher', icon: TicketCheck, title: 'Hotel Voucher Settings', desc: 'Default logo, PDF colors, and Urdu guidelines' },
  { href: '/settings/users', icon: Users, title: 'User Management', desc: 'Admins, moderators and viewers' },
  { href: '/settings/appearance', icon: SwatchBook, title: 'Appearance', desc: 'Color themes with light & dark mode options' },
  { href: '/settings/backup', icon: HardDrive, title: 'Backup & Restore', desc: 'Export/import CRM data with security verification' },
]

export default async function SettingsPage() {
  await requireRole('admin')

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Master Settings"
        subtitle={`Admin registries that seed the calculator, invoices and vouchers. Current rate: 1 SAR = ${fmt(store.exchangeRate)} PKR`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="glass group rounded-xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          >
            <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <s.icon className="h-5 w-5 text-accent-foreground" aria-hidden />
            </span>
            <h2 className="font-heading text-sm font-semibold">{s.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
