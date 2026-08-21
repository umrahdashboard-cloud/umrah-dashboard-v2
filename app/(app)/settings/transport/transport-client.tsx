'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  upsertVehicle, deleteVehicle, upsertRoute, deleteRoute, setMatrixRate,
} from '@/lib/actions'
import type { RouteVehicleRate, TransportRoute, Vehicle } from '@/lib/types'
import { GlassButton, GlassCard, GlassInput, Field, PageHeader } from '@/components/glass'
import { SlideOver } from '@/components/overlay'
import { useToast } from '@/components/toast'

export function TransportClient({
  vehicles, routes, matrix,
}: { vehicles: Vehicle[]; routes: TransportRoute[]; matrix: RouteVehicleRate[] }) {
  const [adding, setAdding] = useState<'vehicle' | 'route' | null>(null)
  const toast = useToast()

  const rateOf = (routeId: string, vehicleId: string) =>
    matrix.find((m) => m.route_id === routeId && m.vehicle_id === vehicleId)?.rate_sar ?? 0

  async function addEntity(formData: FormData) {
    const name = String(formData.get('name'))
    const sort = Number(formData.get('sort_order'))
    if (adding === 'vehicle') await upsertVehicle({ id: '', name, sort_order: sort })
    else await upsertRoute({ id: '', name, sort_order: sort })
    toast(`${adding === 'vehicle' ? 'Vehicle' : 'Route'} added`)
    setAdding(null)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Transport & Rate Matrix"
        subtitle="Set a SAR rate for every route x vehicle combination"
        actions={
          <div className="flex gap-2">
            <GlassButton variant="secondary" onClick={() => setAdding('route')}>
              <Plus className="h-4 w-4" aria-hidden /> Route
            </GlassButton>
            <GlassButton onClick={() => setAdding('vehicle')}>
              <Plus className="h-4 w-4" aria-hidden /> Vehicle
            </GlassButton>
          </div>
        }
      />

      <GlassCard className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-glass-border text-xs text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium align-bottom">Route \ Vehicle</th>
              {vehicles.map((v) => (
                <th key={v.id} className="min-w-[6.5rem] px-2 py-2.5 text-center font-medium align-bottom">
                  <div className="flex flex-col items-center justify-end gap-1">
                    <span className="text-center text-xs leading-snug text-foreground">{v.name}</span>
                    <button
                      type="button"
                      onClick={async () => { await deleteVehicle(v.id); toast('Vehicle deleted') }}
                      aria-label={`Delete ${v.name}`}
                      className="inline-flex shrink-0 items-center justify-center rounded p-0.5 text-muted-foreground/50 hover:text-danger cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routes.map((r, i) => (
              <tr key={r.id} className={i % 2 === 1 ? 'bg-white/2' : ''}>
                <td className="px-4 py-2 align-middle">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    {r.name}
                    <button
                      type="button"
                      onClick={async () => { await deleteRoute(r.id); toast('Route deleted') }}
                      aria-label={`Delete ${r.name}`}
                      className="inline-flex shrink-0 items-center justify-center rounded p-0.5 text-muted-foreground/50 hover:text-danger cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                </td>
                {vehicles.map((v) => (
                  <td key={v.id} className="px-2 py-2 text-center align-middle">
                    <GlassInput
                      type="number"
                      min={0}
                      step="0.01"
                      aria-label={`Rate for ${r.name} in ${v.name}`}
                      defaultValue={rateOf(r.id, v.id) || ''}
                      className="mx-auto w-[4.75rem] text-center tabular-nums"
                      onBlur={async (e) => {
                        const val = Number(e.target.value)
                        if (val !== rateOf(r.id, v.id)) {
                          await setMatrixRate(r.id, v.id, val)
                          toast('Rate updated')
                        }
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
      <p className="text-xs text-muted-foreground">Rates save automatically when a cell loses focus. All values are SAR.</p>

      <SlideOver open={!!adding} onClose={() => setAdding(null)} title={adding === 'vehicle' ? 'Add Vehicle' : 'Add Route'}>
        <form action={addEntity} className="flex flex-col gap-4">
          <Field label="Name"><GlassInput name="name" required autoFocus /></Field>
          <Field label="Sort order"><GlassInput name="sort_order" type="number" min={0} defaultValue={99} /></Field>
          <GlassButton type="submit" className="mt-2">Add</GlassButton>
        </form>
      </SlideOver>
    </div>
  )
}
