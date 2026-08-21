'use client'

import html2canvas from 'html2canvas'
import { createRoot } from 'react-dom/client'
import type { HotelVoucherColorScheme, VoucherData } from '@/lib/types'
import { VoucherPage2 } from './preview'
import { VoucherColorsProvider } from './voucher-colors-context'
import { VOUCHER_PAGE_HEIGHT, VOUCHER_PAGE_WIDTH } from './voucher-dimensions'
import './urdu-fonts.css'

const PAGE_WIDTH_PX = VOUCHER_PAGE_WIDTH
const PAGE_HEIGHT_PX = VOUCHER_PAGE_HEIGHT

let jameelFontPromise: Promise<void> | null = null

function loadJameelFont(): Promise<void> {
  if (jameelFontPromise) return jameelFontPromise

  jameelFontPromise = (async () => {
    await document.fonts.load('16px "Jameel Noori Nastaleeq"')
    await document.fonts.ready
  })()

  return jameelFontPromise
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve()
            return
          }
          img.onload = () => resolve()
          img.onerror = () => resolve()
        }),
    ),
  ).then(() => undefined)
}

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

export async function capturePage2Image(data: VoucherData, colors: HotelVoucherColorScheme): Promise<string> {
  await loadJameelFont()

  const container = document.createElement('div')
  container.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    `width:${PAGE_WIDTH_PX}px`,
    `height:${PAGE_HEIGHT_PX}px`,
    'opacity:0',
    'pointer-events:none',
    'z-index:-9999',
    'overflow:hidden',
    'background:#ffffff',
  ].join(';')

  const mount = document.createElement('div')
  mount.style.width = `${PAGE_WIDTH_PX}px`
  mount.style.height = `${PAGE_HEIGHT_PX}px`
  container.appendChild(mount)
  document.body.appendChild(container)

  const root = createRoot(mount)
  root.render(
    <VoucherColorsProvider colors={colors}>
      <VoucherPage2 data={data} />
    </VoucherColorsProvider>,
  )

  try {
    await waitForImages(container)
    await loadJameelFont()
    await waitForPaint()

    const canvas = await html2canvas(mount, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      width: PAGE_WIDTH_PX,
      height: PAGE_HEIGHT_PX,
    })

    return canvas.toDataURL('image/png')
  } finally {
    root.unmount()
    document.body.removeChild(container)
  }
}
