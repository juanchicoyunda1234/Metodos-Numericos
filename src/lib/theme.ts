export type ColorScheme = 'dark' | 'light'

const STORAGE_KEY = 'numeria-theme'

export function readStoredTheme(): ColorScheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore quota / private mode */
  }
  return 'dark'
}

export function applyTheme(theme: ColorScheme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* ignore quota / private mode */
  }
}
