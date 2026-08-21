import { requireRole } from '@/lib/auth'
import { AppearanceClient } from './appearance-client'

export const metadata = {
  title: 'Appearance — Master Settings',
  description: 'Choose a color theme and light/dark mode for the dashboard',
}

export default async function AppearancePage() {
  await requireRole('admin')
  return <AppearanceClient />
}
