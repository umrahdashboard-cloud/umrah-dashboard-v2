import { requireRole } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { DEFAULT_HOTEL_VOUCHER_SETTINGS } from '@/lib/hotel-voucher-settings'
import { HotelVoucherSettingsClient } from './hotel-voucher-settings-client'
import '@/app/(app)/hotel-vouchers/urdu-fonts.css'
import { Noto_Nastaliq_Urdu } from 'next/font/google'

const notoUrdu = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-urdu',
})

export default async function HotelVoucherSettingsPage() {
  await requireRole('admin')

  return (
    <div className={notoUrdu.variable}>
      <HotelVoucherSettingsClient settings={store.hotelVoucherSettings ?? DEFAULT_HOTEL_VOUCHER_SETTINGS} />
    </div>
  )
}
