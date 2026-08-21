export const COLOR_THEME_IDS = ['lapis', 'emerald', 'gold', 'ocean', 'red', 'purple'] as const

export type ThemeMode = 'light' | 'dark'
export type ColorThemeId = (typeof COLOR_THEME_IDS)[number]

export const THEME_COOKIE = 'crm-theme'
export const COLOR_THEME_COOKIE = 'crm-color-theme'

export function parseThemeCookie(value: string | undefined): ThemeMode {
  if (value === 'light') return 'light'
  if (value === 'dark') return 'dark'
  return 'dark'
}

export function parseColorThemeCookie(value: string | undefined): ColorThemeId {
  if (value && (COLOR_THEME_IDS as readonly string[]).includes(value)) {
    return value as ColorThemeId
  }
  return 'lapis'
}

/** Runs in <head> before paint — syncs cookie/localStorage to the DOM. */
export const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement;function gc(n){var m=document.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'));return m?decodeURIComponent(m[1]):null}var t=gc('${THEME_COOKIE}')||localStorage.getItem('theme');var c=gc('${COLOR_THEME_COOKIE}')||localStorage.getItem('color-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}if(t==='light'){d.classList.add('light');d.classList.remove('dark');}else{d.classList.remove('light');d.classList.add('dark');}localStorage.setItem('theme',t);document.cookie='${THEME_COOKIE}='+t+';path=/;max-age=31536000;SameSite=Lax';var valid=['lapis','emerald','gold','ocean','red','purple'];if(c&&valid.indexOf(c)!==-1&&c!=='lapis'){d.setAttribute('data-theme',c);localStorage.setItem('color-theme',c);document.cookie='${COLOR_THEME_COOKIE}='+c+';path=/;max-age=31536000;SameSite=Lax';}else{d.removeAttribute('data-theme');localStorage.setItem('color-theme','lapis');document.cookie='${COLOR_THEME_COOKIE}=lapis;path=/;max-age=31536000;SameSite=Lax';}}catch(e){}})();`

export function persistThemeMode(theme: ThemeMode) {
  localStorage.setItem('theme', theme)
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`
}

export function persistColorTheme(colorTheme: ColorThemeId) {
  localStorage.setItem('color-theme', colorTheme)
  document.cookie = `${COLOR_THEME_COOKIE}=${colorTheme};path=/;max-age=31536000;SameSite=Lax`
}

export function readStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'dark'
  }
}

export function readStoredColorTheme(): ColorThemeId {
  try {
    const saved = localStorage.getItem('color-theme')
    if (saved && (COLOR_THEME_IDS as readonly string[]).includes(saved)) {
      return saved as ColorThemeId
    }
  } catch {
    /* ignore */
  }
  return 'lapis'
}

export function applyThemeMode(theme: ThemeMode) {
  const html = document.documentElement
  if (theme === 'light') {
    html.classList.add('light')
    html.classList.remove('dark')
  } else {
    html.classList.remove('light')
    html.classList.add('dark')
  }
}

export function applyColorThemeId(colorTheme: ColorThemeId) {
  const html = document.documentElement
  if (colorTheme === 'lapis') {
    html.removeAttribute('data-theme')
  } else {
    html.setAttribute('data-theme', colorTheme)
  }
}
