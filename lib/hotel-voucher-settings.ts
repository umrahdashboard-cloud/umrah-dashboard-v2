import type { HotelVoucherColorScheme, HotelVoucherSettings, VoucherData } from '@/lib/types'

export const DEFAULT_HOTEL_VOUCHER_COLORS: HotelVoucherColorScheme = {
  navy: '#1E3A5F',
  gold: '#B08420',
  text: '#1F2937',
  muted: '#6B7280',
  border: '#D8DEE6',
  lightBg: '#F4F6F9',
  noteBg: '#FDF8ED',
}

export const DEFAULT_HOTEL_VOUCHER_GUIDELINES = `1. ہوٹل میں موصول ہونے کے وقت داخلے کے فارم پر دستخط ضروری ہیں
2. ہوٹل سے فوری طور پر باہر نکالنے کی صورت میں کوئی رقم واپس نہیں دی جائے گی
3. ہوٹل میں اپنی تمام چیزوں کا خیال رکھیں
4. ہوٹل میں شور و غل سے پرہیز کریں
5. رات میں ہوٹل سے باہر جانے کی اجازت نہیں
6. ہوٹل کی تمام ہدایات پر عمل کریں
7. ہوٹل کے اہلکاروں سے احترام سے سلوک کریں
8. ہوٹل میں کوئی شیٹیں وغیرہ نہ نقل کریں
9. ہوٹل میں الیکٹرانی اشیاء محفوظ رکھیں
10. ہوٹل سے باہر نکالنے سے پہلے بل ادا کریں
11. ہوٹل میں داخلہ لینے کے وقت شناخت بھی لانی ضروری ہے
12. ہوٹل کے ڈبہ میں اپنی قیمتی اشیاء رکھیں
13. ہوٹل میں کوئی آتش بازی وغیرہ نہ کریں
14. ہوٹل میں شراب وغیرہ حرام چیزوں کا استعمال سختی سے منع ہے
15. ہوٹل میں شے ضائع ہونے کی صورت میں رقم ادا کرنی ہوگی
16. ہوٹل میں داخلہ سے قبل تمام شے کی تفتیش کریں
17. ہوٹل میں آپ کی حفاظت ہماری ذمہ داری ہے
18. ہوٹل میں صفائی کا خیال رکھیں
19. ہوٹل کی تمام چیزوں سے احتیاط کریں
20. ہوٹل میں کوئی مسئلہ ہو تو فوری طور پر منتظم سے رابطہ کریں
21. میں نے ان تمام ہدایات کو پڑھا ہے اور ان پر عمل کرنے کا عہد کرتا ہوں`

export const DEFAULT_HOTEL_VOUCHER_SETTINGS: HotelVoucherSettings = {
  default_logo_data: null,
  logo_width: 120,
  logo_height: 64,
  logo_show_page1: true,
  logo_show_page2: true,
  company_name_header: 'Fast Travels',
  company_name_header_show: true,
  company_name_meta: 'Fast Travels',
  company_name_meta_show: true,
  guidelines_urdu: DEFAULT_HOTEL_VOUCHER_GUIDELINES,
  colors: DEFAULT_HOTEL_VOUCHER_COLORS,
  checkin_time: '14:00',
  checkout_time: '12:00',
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized
  const num = parseInt(value, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export type VoucherPdfColors = {
  navy: readonly [number, number, number]
  gold: readonly [number, number, number]
  text: readonly [number, number, number]
  muted: readonly [number, number, number]
  border: readonly [number, number, number]
  lightBg: readonly [number, number, number]
  noteBg: readonly [number, number, number]
  white: readonly [number, number, number]
}

export function colorsToPdfRgb(colors: HotelVoucherColorScheme): VoucherPdfColors {
  return {
    navy: hexToRgb(colors.navy),
    gold: hexToRgb(colors.gold),
    text: hexToRgb(colors.text),
    muted: hexToRgb(colors.muted),
    border: hexToRgb(colors.border),
    lightBg: hexToRgb(colors.lightBg),
    noteBg: hexToRgb(colors.noteBg),
    white: [255, 255, 255],
  }
}

export function buildDefaultVoucherData(settings: HotelVoucherSettings): VoucherData {
  return {
    voucher_number: '',
    reference_no: '',
    voucher_date: new Date().toISOString().slice(0, 10),
    family_head: '',
    package_info: '',
    company_name_header: settings.company_name_header,
    company_name_header_show: settings.company_name_header_show,
    company_name_meta: settings.company_name_meta,
    company_name_meta_show: settings.company_name_meta_show,
    pilgrims: [{
      id: '1',
      mutamer_name: '',
      passport_no: '',
      passport_show: false,
      visa_number: '',
      visa_show: false,
      pax: 1,
      beds: 1,
      gender: 'M',
    }],
    hotels: [{
      id: '1',
      city: 'Makkah',
      confirmation_no: '',
      hotel_name: '',
      hotel_id: null,
      is_custom: false,
      room_type: 'double',
      meal_plan: 'BB',
      checkin_date: '',
      nights: 0,
    }],
    makkah_hotel_contact: '',
    madinah_hotel_contact: '',
    makkah_transport_contact: '',
    madinah_transport_contact: '',
    jeddah_transport_contact: '',
    checkin_time: settings.checkin_time,
    checkout_time: settings.checkout_time,
    logo_data: settings.default_logo_data,
    logo_show_page1: settings.logo_show_page1,
    logo_show_page2: settings.logo_show_page2,
    logo_width: settings.logo_width,
    logo_height: settings.logo_height,
    logo_x: 30,
    logo_y: 30,
    guidelines_urdu: settings.guidelines_urdu,
  }
}
