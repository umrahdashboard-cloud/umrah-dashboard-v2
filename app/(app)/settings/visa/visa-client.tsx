'use client'

import { saveVisaSettings } from '@/lib/actions'
import type { VisaSettings } from '@/lib/types'
import { GlassButton, GlassCard, GlassInput, GlassSelect, Field, PageHeader } from '@/components/glass'
import { useToast } from '@/components/toast'

export function VisaClient({ visa }: { visa: VisaSettings }) {
  const toast = useToast()

  async function save(formData: FormData) {
    const n = (k: string) => Number(formData.get(k))
    await saveVisaSettings({
      transport_mode: formData.get('transport_mode') as VisaSettings['transport_mode'],
      child_sar: n('child_sar'), infant_sar: n('infant_sar'),
      ziarat_makkah_sar: n('ziarat_makkah_sar'), ziarat_madinah_sar: n('ziarat_madinah_sar'),
      ziarat_badr_sar: n('ziarat_badr_sar'), ziarat_taif_sar: n('ziarat_taif_sar'),
      pax_1_sar: n('pax_1_sar'), pax_2_sar: n('pax_2_sar'), pax_3_sar: n('pax_3_sar'),
      pax_4_sar: n('pax_4_sar'), group_sar: n('group_sar'),
    })
    toast('Visa settings saved')
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Visa Settings Master" subtitle="All rates in SAR — converted live via the exchange rate" />
      <form action={save} className="flex flex-col gap-6">
        <GlassCard className="p-6">
          <h2 className="mb-4 font-heading text-sm font-semibold">General</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Transport mode">
              <GlassSelect name="transport_mode" defaultValue={visa.transport_mode}>
                <option value="included">Included in visa</option>
                <option value="separate">Separate</option>
              </GlassSelect>
            </Field>
            <Field label="Child rate (SAR)"><GlassInput name="child_sar" type="number" min={0} step="0.01" defaultValue={visa.child_sar} /></Field>
            <Field label="Infant rate (SAR)"><GlassInput name="infant_sar" type="number" min={0} step="0.01" defaultValue={visa.infant_sar} /></Field>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-4 font-heading text-sm font-semibold">Tiered adult visa rates (SAR / adult)</h2>
          <div className="grid gap-4 sm:grid-cols-5">
            <Field label="1 pax"><GlassInput name="pax_1_sar" type="number" min={0} step="0.01" defaultValue={visa.pax_1_sar} /></Field>
            <Field label="2 pax"><GlassInput name="pax_2_sar" type="number" min={0} step="0.01" defaultValue={visa.pax_2_sar} /></Field>
            <Field label="3 pax"><GlassInput name="pax_3_sar" type="number" min={0} step="0.01" defaultValue={visa.pax_3_sar} /></Field>
            <Field label="4 pax"><GlassInput name="pax_4_sar" type="number" min={0} step="0.01" defaultValue={visa.pax_4_sar} /></Field>
            <Field label="5–49 pax (group)"><GlassInput name="group_sar" type="number" min={0} step="0.01" defaultValue={visa.group_sar} /></Field>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-4 font-heading text-sm font-semibold">Flat ziarat rates (SAR)</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Makkah"><GlassInput name="ziarat_makkah_sar" type="number" min={0} step="0.01" defaultValue={visa.ziarat_makkah_sar} /></Field>
            <Field label="Madinah"><GlassInput name="ziarat_madinah_sar" type="number" min={0} step="0.01" defaultValue={visa.ziarat_madinah_sar} /></Field>
            <Field label="Badr"><GlassInput name="ziarat_badr_sar" type="number" min={0} step="0.01" defaultValue={visa.ziarat_badr_sar} /></Field>
            <Field label="Taif"><GlassInput name="ziarat_taif_sar" type="number" min={0} step="0.01" defaultValue={visa.ziarat_taif_sar} /></Field>
          </div>
        </GlassCard>

        <GlassButton type="submit" className="self-start">Save Visa Settings</GlassButton>
      </form>
    </div>
  )
}
