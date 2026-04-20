import { createModuleStore } from '@os/store/createModuleStore'

export type Theme = 'dark' | 'light' | 'lifted'

const THEME_VALUES: readonly Theme[] = ['dark', 'light', 'lifted'] as const

function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (THEME_VALUES as readonly string[]).includes(v)
}

const themeStore = createModuleStore<Theme>({
  initial: 'dark',
  storageKey: 'theme',
  parse: (raw) => (isTheme(raw) ? raw : undefined),
  serialize: (v) => v,
})

function applyToDom(theme: Theme) {
  if (document.documentElement.getAttribute('data-theme') !== theme) {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

applyToDom(themeStore.get())
themeStore.subscribe(() => applyToDom(themeStore.get()))

export function setTheme(next: Theme): void { themeStore.set(next) }

export function toggleTheme(): void {
  const cur = themeStore.get()
  themeStore.set(cur === 'dark' ? 'light' : cur === 'light' ? 'lifted' : 'dark')
}

export function useTheme() {
  const theme = themeStore.use()
  return { theme, toggle: toggleTheme } as const
}
