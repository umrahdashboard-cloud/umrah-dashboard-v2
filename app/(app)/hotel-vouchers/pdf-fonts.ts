// Poppins font loader for jsPDF.
// Fetches TTF files from /public/fonts, converts to base64, and registers them
// with a jsPDF document instance. Results are cached per session.

const FONT_FILES = [
  { file: '/fonts/Poppins-Regular.ttf', vfsName: 'Poppins-Regular.ttf', style: 'normal' },
  { file: '/fonts/Poppins-SemiBold.ttf', vfsName: 'Poppins-SemiBold.ttf', style: 'semibold' },
  { file: '/fonts/Poppins-Bold.ttf', vfsName: 'Poppins-Bold.ttf', style: 'bold' },
] as const

let fontCache: Array<{ vfsName: string; style: string; base64: string }> | null = null

async function fetchFontAsBase64(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch font: ${url}`)
  const buffer = await res.arrayBuffer()

  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

/**
 * Registers the Poppins font family on a jsPDF document.
 * Returns true when Poppins was registered, false when it failed (caller
 * should fall back to helvetica).
 */
export async function registerPoppins(doc: any): Promise<boolean> {
  try {
    if (!fontCache) {
      fontCache = await Promise.all(
        FONT_FILES.map(async (f) => ({
          vfsName: f.vfsName,
          style: f.style,
          base64: await fetchFontAsBase64(f.file),
        })),
      )
    }

    for (const font of fontCache) {
      doc.addFileToVFS(font.vfsName, font.base64)
      doc.addFont(font.vfsName, 'Poppins', font.style)
    }
    return true
  } catch (e) {
    console.warn('[v0] Could not register Poppins, falling back to helvetica:', e)
    fontCache = null
    return false
  }
}
