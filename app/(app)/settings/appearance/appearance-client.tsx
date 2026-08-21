'use client'

import { Check, Moon, Sun } from 'lucide-react'
import { PageHeader } from '@/components/glass'
import { useTheme, type ColorTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

interface ThemeOption {
  id: ColorTheme
  name: string
  description: string
  /* swatches: [primary, dark bg, light bg, accent] */
  primary: string
  darkBg: string
  lightBg: string
  accent: string
}

const THEMES: ThemeOption[] = [
  {
    id: 'lapis',
    name: 'Lapis Night',
    description: 'Deep ink navy with a lapis blue accent and restrained gold. The signature look.',
    primary: '#3e6ff2',
    darkBg: '#0b1220',
    lightBg: '#f9fafb',
    accent: '#d4af6a',
  },
  {
    id: 'emerald',
    name: 'Emerald Oasis',
    description: 'Calm deep greens inspired by the oasis — fresh, balanced and easy on the eyes.',
    primary: '#2eb888',
    darkBg: '#0b1611',
    lightBg: '#f6faf7',
    accent: '#d4af6a',
  },
  {
    id: 'gold',
    name: 'Desert Gold',
    description: 'Warm amber and sand tones with a rich golden primary — premium and inviting.',
    primary: '#dfa334',
    darkBg: '#17120a',
    lightBg: '#fbf8f1',
    accent: '#3e9ff2',
  },
  {
    id: 'ocean',
    name: 'Ocean Teal',
    description: 'Cool aqua blues with a crisp teal primary — modern, clean and professional.',
    primary: '#26b0cf',
    darkBg: '#071a20',
    lightBg: '#f5fafb',
    accent: '#d4af6a',
  },
  {
    id: 'red',
    name: 'Crimson Rose',
    description: 'Bold ruby reds with warm undertones — energetic, confident and striking.',
    primary: '#ef5350',
    darkBg: '#140a0c',
    lightBg: '#fdf5f5',
    accent: '#d4af6a',
  },
  {
    id: 'purple',
    name: 'Royal Violet',
    description: 'Rich violet and plum tones — elegant, premium and distinctly modern.',
    primary: '#9d6df7',
    darkBg: '#0f0a16',
    lightBg: '#f9f6fd',
    accent: '#d4af6a',
  },
]

export function AppearanceClient() {
  const { theme, toggleTheme, colorTheme, setColorTheme } = useTheme()

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Appearance"
        subtitle="Choose a color theme for the dashboard. Every theme supports both light and dark mode."
      />

      {/* Mode selector */}
      <section aria-labelledby="mode-heading" className="glass rounded-xl p-5">
        <h2 id="mode-heading" className="font-heading text-sm font-semibold">Mode</h2>
        <p className="mt-1 text-xs text-muted-foreground">Switch between light and dark appearance.</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => theme === 'dark' && toggleTheme()}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors',
              theme === 'light'
                ? 'border-primary/60 bg-accent text-accent-foreground'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
            aria-pressed={theme === 'light'}
          >
            <Sun className="h-4 w-4" aria-hidden /> Light
            {theme === 'light' && <Check className="h-3.5 w-3.5" aria-hidden />}
          </button>
          <button
            onClick={() => theme === 'light' && toggleTheme()}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors',
              theme === 'dark'
                ? 'border-primary/60 bg-accent text-accent-foreground'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
            aria-pressed={theme === 'dark'}
          >
            <Moon className="h-4 w-4" aria-hidden /> Dark
            {theme === 'dark' && <Check className="h-3.5 w-3.5" aria-hidden />}
          </button>
        </div>
      </section>

      {/* Theme cards */}
      <section aria-labelledby="theme-heading" className="flex flex-col gap-3">
        <div>
          <h2 id="theme-heading" className="font-heading text-sm font-semibold">Color Theme</h2>
          <p className="mt-1 text-xs text-muted-foreground">Applied instantly across the entire dashboard and saved to this device.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {THEMES.map((t) => {
            const selected = colorTheme === t.id
            return (
              <button
                key={t.id}
                onClick={() => setColorTheme(t.id)}
                aria-pressed={selected}
                className={cn(
                  'glass group relative rounded-xl p-5 text-left transition-all hover:-translate-y-0.5',
                  selected && 'ring-2 ring-primary border-primary/40',
                )}
              >
                {selected && (
                  <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3.5 w-3.5 text-primary-foreground" aria-hidden />
                  </span>
                )}

                {/* Swatch preview */}
                <div className="mb-4 flex items-center gap-2">
                  <span
                    className="h-10 w-10 rounded-lg border border-border"
                    style={{ background: t.primary }}
                    aria-hidden
                  />
                  <span
                    className="h-10 w-10 rounded-lg border border-border"
                    style={{ background: t.darkBg }}
                    aria-hidden
                  />
                  <span
                    className="h-10 w-10 rounded-lg border border-border"
                    style={{ background: t.lightBg }}
                    aria-hidden
                  />
                  <span
                    className="h-10 w-10 rounded-lg border border-border"
                    style={{ background: t.accent }}
                    aria-hidden
                  />
                </div>

                <h3 className="font-heading text-sm font-semibold">{t.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  <Sun className="mr-1 inline h-3 w-3" aria-hidden />
                  Light &amp; <Moon className="mx-1 inline h-3 w-3" aria-hidden /> Dark supported
                </p>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
