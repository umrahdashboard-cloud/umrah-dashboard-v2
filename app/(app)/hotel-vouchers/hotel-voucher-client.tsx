'use client'

import { useState, useCallback, useMemo } from 'react'
import { Download, RotateCcw } from 'lucide-react'
import { GlassButton } from '@/components/glass'
import { useToast } from '@/components/toast'
import type { Hotel, HotelContactEntry, HotelVoucherSettings, TransportContactEntry, VoucherData } from '@/lib/types'
import { buildDefaultVoucherData } from '@/lib/hotel-voucher-settings'
import { VoucherForm } from './form'
import { VoucherPreview } from './preview'
import { downloadVoucherPdf } from './pdf-utils'
import { VoucherColorsProvider } from './voucher-colors-context'
import { store } from '@/lib/demo-store'

export function HotelVoucherClient({
  settings,
  hotelContacts,
  transportContacts,
  registryHotels,
}: {
  settings: HotelVoucherSettings
  hotelContacts: HotelContactEntry[]
  transportContacts: TransportContactEntry[]
  registryHotels: Hotel[]
}) {
  const defaultData = useMemo(() => buildDefaultVoucherData(settings), [settings])
  const [data, setData] = useState<VoucherData>(defaultData)
  const [previewPage, setPreviewPage] = useState<1 | 2>(1)
  const [uploading, setUploading] = useState(false)
  const toast = useToast()

  const handleNewVoucher = useCallback(() => {
    setData(buildDefaultVoucherData(settings))
    setPreviewPage(1)
  }, [settings])

  const handleDownload = useCallback(async () => {
    setUploading(true)
    try {
      await downloadVoucherPdf(data, settings.colors)
      toast('Voucher downloaded successfully')
    } catch (err) {
      console.error('[v0] PDF download failed:', err)
      toast('Failed to download voucher', 'error')
    } finally {
      setUploading(false)
    }
  }, [data, settings.colors, toast])

  const handleDataChange = useCallback((newData: VoucherData) => {
    setData(newData)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background rounded-2xl">
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur px-6 py-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">Hotel Voucher</h1>
              <p className="text-xs text-muted-foreground">Generate print-ready hotel vouchers for pilgrims</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton onClick={handleNewVoucher} variant="ghost" className="text-sm">
              <RotateCcw className="h-4 w-4" aria-hidden />
              New Package
            </GlassButton>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6 lg:flex-row lg:items-start">
        {/* Form — left on desktop, scrolls with the page */}
        <div className="min-w-0 flex-1 rounded-xl p-2">
          <VoucherForm
            data={data}
            onChange={handleDataChange}
            availableHotels={{
              makkah: store.hotels.filter(h => h.city === 'Makkah'),
              madinah: store.hotels.filter(h => h.city === 'Madinah'),
            }}
            hotelContacts={hotelContacts}
            transportContacts={transportContacts}
            registryHotels={registryHotels}
          />

          <div className="mt-6 flex gap-2 lg:hidden">
            <GlassButton
              className="w-full"
              onClick={handleDownload}
              disabled={uploading}
            >
              <Download className="h-4 w-4" aria-hidden />
              {uploading ? 'Generating...' : 'Save & Download Voucher'}
            </GlassButton>
          </div>
        </div>

        {/* Preview — right on desktop, stays visible while form scrolls */}
        <div className="hidden lg:sticky lg:top-20 lg:z-10 lg:flex lg:w-1/2 lg:max-w-[50%] lg:flex-col lg:gap-4 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              <button
                onClick={() => setPreviewPage(1)}
                className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors ${previewPage === 1
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Page 1 (English)
              </button>
              <button
                onClick={() => setPreviewPage(2)}
                className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors ${previewPage === 2
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Page 2 (اردو)
              </button>
            </div>
            <GlassButton
              className="ml-auto rounded-full"
              onClick={handleDownload}
              disabled={uploading}
            >
              <Download className="h-4 w-4 " aria-hidden />
              {uploading ? 'Generating...' : 'Save & Download'}
            </GlassButton>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <VoucherColorsProvider colors={settings.colors}>
              <VoucherPreview data={data} page={previewPage} />
            </VoucherColorsProvider>
          </div>

          <p className="text-center text-xs text-muted-foreground">Live preview — both pages are included in the downloaded PDF.</p>
        </div>
      </div>
    </div>
  )
}
