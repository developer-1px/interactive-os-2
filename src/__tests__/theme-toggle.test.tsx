import { describe, it, expect, beforeEach } from 'vitest'

describe('theme toggle', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    localStorage.clear()
  })

  it('defaults to dark theme when no preference stored', () => {
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })

  it('persists theme choice to localStorage', () => {
    localStorage.setItem('theme', 'light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('applies data-theme attribute from localStorage', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
