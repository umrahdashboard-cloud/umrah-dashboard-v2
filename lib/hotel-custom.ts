import type { City, CustomHotelData, Hotel } from './types'

export const CUSTOM_HOTEL_ID = '__custom__'

export const EMPTY_CUSTOM_HOTEL: CustomHotelData = {
  name: '',
  location: '',
  distance: '',
  room_sar: 0,
  sharing_sar: 0,
  double_sar: 0,
  triple_sar: 0,
  quad_sar: 0,
}

export function customHotelToHotel(city: City, data: CustomHotelData): Hotel {
  return {
    id: CUSTOM_HOTEL_ID,
    city,
    name: data.name,
    location: data.location,
    distance: data.distance,
    contact: '',
    room_sar: data.room_sar,
    sharing_sar: data.sharing_sar,
    double_sar: data.double_sar,
    triple_sar: data.triple_sar,
    quad_sar: data.quad_sar,
  }
}

export function resolveHotel(
  hotelId: string,
  custom: CustomHotelData | null | undefined,
  city: City,
  hotels: Hotel[],
): Hotel | null {
  if (hotelId === CUSTOM_HOTEL_ID && custom?.name.trim()) {
    return customHotelToHotel(city, custom)
  }
  return hotels.find((h) => h.id === hotelId) ?? null
}
