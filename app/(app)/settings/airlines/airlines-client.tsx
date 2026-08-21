'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { upsertAirline, deleteAirline } from '@/lib/actions'
import { fmt } from '@/lib/currency'
import type { Airline } from '@/lib/types'
import { GlassButton, GlassCard, GlassInput, Field, PageHeader } from '@/components/glass'
import { SlideOver } from '@/components/overlay'
import { useToast } from '@/components/toast'

const EMPTY: Airline = { id: '', name: '', adult_pkr: 0, child_pkr: 0, infant_pkr: 0 }

export function AirlinesClient({ airlines }: { airlines: Airline[] }) {
  const [editing, setEditing] = useState<Airline | null>(null)
  const toast = useToast()

  async function save(formData: FormData) {
    await upsertAirline({
      id: editing?.id ?? '',
      name: String(formData.get('name')),
      adult_pkr: Number(formData.get('adult_pkr')),
      child_pkr: Number(formData.get('child_pkr')),
      infant_pkr: Number(formData.get('infant_pkr')),
    })
    toast('Airline saved')
    setEditing(null)
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Airline Registry"
        subtitle="PKR ticket prices used by the package calculator"
        actions={
          <GlassButton onClick={() => setEditing(EMPTY)}>
            <Plus className="h-4 w-4" aria-hidden /> Add Airline
          </GlassButton>
        }
      />
      <GlassCard className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Airline</th>
              <th className="px-4 py-3 text-right font-medium">Adult (PKR)</th>
              <th className="px-4 py-3 text-right font-medium">Child (PKR)</th>
              <th className="px-4 py-3 text-right font-medium">Infant (PKR)</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {airlines.map((a, i) => (
              <tr key={a.id} className={i % 2 === 1 ? 'bg-white/2' : ''}>
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3 text-right tabular">{fmt(a.adult_pkr)}</td>
                <td className="px-4 py-3 text-right tabular">{fmt(a.child_pkr)}</td>
                <td className="px-4 py-3 text-right tabular">{fmt(a.infant_pkr)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(a)} aria-label={`Edit ${a.name}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/6 hover:text-foreground cursor-pointer">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={async () => { await deleteAirline(a.id); toast('Airline deleted') }}
                      aria-label={`Delete ${a.name}`}
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

      <SlideOver open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Airline' : 'Add Airline'}>
        {editing && (
          <form action={save} className="flex flex-col gap-4">
            <Field label="Airline name">
              <GlassInput name="name" defaultValue={editing.name} required />
            </Field>
            <Field label="Adult ticket (PKR)">
              <GlassInput name="adult_pkr" type="number" min={0} defaultValue={editing.adult_pkr || ''} required />
            </Field>
            <Field label="Child ticket (PKR)">
              <GlassInput name="child_pkr" type="number" min={0} defaultValue={editing.child_pkr || ''} required />
            </Field>
            <Field label="Infant ticket (PKR)">
              <GlassInput name="infant_pkr" type="number" min={0} defaultValue={editing.infant_pkr || ''} required />
            </Field>
            <GlassButton type="submit" className="mt-2">Save Airline</GlassButton>
          </form>
        )}
      </SlideOver>
    </div>
  )
}
