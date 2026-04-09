/**
 * A2UI v0.9 Theme — maps createSurface theme to CSS custom properties
 *
 * Theme properties:
 * - primaryColor → --a2ui-primary
 * - iconUrl → --a2ui-icon-url
 * - agentDisplayName → --a2ui-agent-name (available via CSS content)
 */
import type { A2UITheme } from './a2uiProtocol'

/** Convert theme object to CSS custom property map */
export function themeToCssVars(theme: A2UITheme | undefined): Record<string, string> {
  if (!theme) return {}
  const vars: Record<string, string> = {}
  if (theme.primaryColor) vars['--a2ui-primary'] = theme.primaryColor
  if (theme.iconUrl) vars['--a2ui-icon-url'] = `url(${theme.iconUrl})`
  if (theme.agentDisplayName) vars['--a2ui-agent-name'] = `"${theme.agentDisplayName}"`
  return vars
}

/** Apply theme CSS vars to an element (for surface root container) */
export function applyThemeToElement(element: HTMLElement, theme: A2UITheme | undefined): void {
  const vars = themeToCssVars(theme)
  // Clear previous a2ui vars
  for (const prop of [...element.style]) {
    if (prop.startsWith('--a2ui-')) element.style.removeProperty(prop)
  }
  for (const [k, v] of Object.entries(vars)) {
    element.style.setProperty(k, v)
  }
}
