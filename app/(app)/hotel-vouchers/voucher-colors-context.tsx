'use client'

import { createContext, useContext } from 'react'
import type { HotelVoucherColorScheme } from '@/lib/types'
import { DEFAULT_HOTEL_VOUCHER_COLORS } from '@/lib/hotel-voucher-settings'

const VoucherColorsContext = createContext<HotelVoucherColorScheme>(DEFAULT_HOTEL_VOUCHER_COLORS)

export function VoucherColorsProvider({
  colors,
  children,
}: {
  colors: HotelVoucherColorScheme
  children: React.ReactNode
}) {
  return <VoucherColorsContext.Provider value={colors}>{children}</VoucherColorsContext.Provider>
}

export function useVoucherColors() {
  return useContext(VoucherColorsContext)
}
