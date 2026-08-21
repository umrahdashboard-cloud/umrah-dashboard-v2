import { Analytics } from '@vercel/analytics/next'
import { cookies } from 'next/headers'
import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import {
  COLOR_THEME_COOKIE,
  parseColorThemeCookie,
  parseThemeCookie,
  THEME_COOKIE,
  THEME_INIT_SCRIPT,
} from '@/lib/theme-storage'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Umrah Dashboard',
  description: 'Premium Hajj & Umrah travel agency CRM — bookings, invoicing, ledger, and vouchers.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const theme = parseThemeCookie(cookieStore.get(THEME_COOKIE)?.value)
  const colorTheme = parseColorThemeCookie(cookieStore.get(COLOR_THEME_COOKIE)?.value)

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${theme === 'light' ? 'light' : 'dark'} bg-background ${inter.variable} ${poppins.variable}`}
      {...(colorTheme !== 'lapis' ? { 'data-theme': colorTheme } : {})}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <ThemeProvider defaultTheme={theme} defaultColorTheme={colorTheme}>
          {children}
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
