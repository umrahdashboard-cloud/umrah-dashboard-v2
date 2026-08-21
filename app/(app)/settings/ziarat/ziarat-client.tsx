'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { upsertZiarat, deleteZiarat } from '@/lib/actions'
import { fmt } from '@/lib/currency'
import type { Ziarat } from '@/lib/types'
import { GlassButton, GlassCard, GlassInput, Field, PageHeader } from '@/components/glass'
import { SlideOver } from '@/components/overlay'
import { useToast } from '@/components/toast'

const EMPTY: Ziarat = { id: '', name: '', slug: '', rate_sar: 0, sort_order: 99 }

export function ZiaratClient({ ziarats }: { ziarats: Ziarat[] }) {
  const [editing, setEditing] = useState<Ziarat | null>(null)
  const toast = useToast()

  async function save(formData: FormData) {
    const name = String(formData.get('name'))
    await upsertZiarat({
      id: editing?.id ?? '',
      name,
      slug: String(formData.get('slug')) || name.toLowerCase().replace(/\s+/g, '-'),
      rate_sar: Number(formData.get('rate_sar')),
      sort_order: Number(formData.get('sort_order')),
    })
    toast('Ziarat saved')
    setEditing(null)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Ziarat Master"
        subtitle="Per-pax SAR rates for ziarat sites"
        actions={
          <GlassButton onClick={() => setEditing(EMPTY)}>
            <Plus className="h-4 w-4" aria-hidden /> Add Ziarat
          </GlassButton>
        }
      />
      <GlassCard className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 text-right font-medium">Rate (SAR)</th>
              <th className="px-4 py-3 text-right font-medium">Sort</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ziarats.map((z, i) => (
              <tr key={z.id} className={i % 2 === 1 ? 'bg-white/2' : ''}>
                <td className="px-4 py-3 font-medium">{z.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{z.slug}</td>
                <td className="px-4 py-3 text-right tabular">{fmt(z.rate_sar)}</td>
                <td className="px-4 py-3 text-right tabular">{z.sort_order}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(z)} aria-label={`Edit ${z.name}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/6 hover:text-foreground cursor-pointer">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={async () => { await deleteZiarat(z.id); toast('Ziarat deleted') }}
                      aria-label={`Delete ${z.name}`}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/15 hover:text-danger cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <SlideOver open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Ziarat' : 'Add Ziarat'}>
        {editing && (
          <form action={save} className="flex flex-col gap-4">
            <Field label="Name"><GlassInput name="name" defaultValue={editing.name} required /></Field>
            <Field label="Slug (auto if blank)"><GlassInput name="slug" defaultValue={editing.slug} /></Field>
            <Field label="Rate (SAR / pax)"><GlassInput name="rate_sar" type="number" min={0} step="0.01" defaultValue={editing.rate_sar || ''} required /></Field>
            <Field label="Sort order"><GlassInput name="sort_order" type="number" min={0} defaultValue={editing.sort_order} /></Field>
            <GlassButton type="submit" className="mt-2">Save Ziarat</GlassButton>
          </form>
        )}
      </SlideOver>
    </div>
  )
}
