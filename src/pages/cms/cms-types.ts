export type Locale = 'ko' | 'en' | 'ja'
export const LOCALES: Locale[] = ['ko', 'en', 'ja']
export const DEFAULT_LOCALE: Locale = 'ko'

export type LocaleMap = Record<Locale, string>

// Helper: create a locale map with a default value for ko, empty for others
export function localeMap(ko: string): LocaleMap {
  return { ko, en: '', ja: '' }
}

// Helper: get localized value with fallback
export function localized(value: string | LocaleMap, locale: Locale): { text: string; isFallback: boolean } {
  if (typeof value === 'string') return { text: value, isFallback: false }
  const text = value[locale]
  if (text) return { text, isFallback: false }
  const fallback = value[DEFAULT_LOCALE]
  return { text: fallback, isFallback: true }
}
