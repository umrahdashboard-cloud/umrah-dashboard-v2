import { SettingsBackNav } from '@/components/settings-back-nav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <SettingsBackNav className="mb-1" />
      {children}
    </div>
  )
}
