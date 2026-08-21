import { Noto_Nastaliq_Urdu } from 'next/font/google'
import { store } from '@/lib/demo-store'
import { DEFAULT_HOTEL_VOUCHER_SETTINGS } from '@/lib/hotel-voucher-settings'
import { HotelVoucherClient } from './hotel-voucher-client'
import './urdu-fonts.css'

const notoUrdu = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-urdu',
})

export const metadata = {
  title: 'Hotel Voucher Maker',
  description: 'Generate print-ready hotel vouchers for pilgrims',
}

export default function HotelVoucherPage() {
  return (
    <div className={notoUrdu.variable}>
      <HotelVoucherClient
        settings={store.hotelVoucherSettings ?? DEFAULT_HOTEL_VOUCHER_SETTINGS}
        hotelContacts={store.hotelContacts ?? []}
        transportContacts={store.transportContacts ?? []}
        registryHotels={store.hotels}
      />
    </div>
  )
}
