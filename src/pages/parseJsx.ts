export interface ParsedJsx {
  name: string
  props: Record<string, string | boolean>
}

export function parseJsx(input: string): ParsedJsx | null {
  const trimmed = input.trim()

  // Must be a self-closing tag: <Name ... />
  const match = trimmed.match(/^<([A-Z][A-Za-z0-9]*)(\s[^>]*)?\s*\/>$/)
  if (!match) return null

  const name = match[1]
  const attrString = match[2]?.trim() ?? ''
  const props: Record<string, string | boolean> = {}

  if (attrString) {
    // Match: key="value" or key (boolean)
    const attrRegex = /([a-zA-Z][a-zA-Z0-9]*)(?:="([^"]*)")?/g
    let attrMatch
    while ((attrMatch = attrRegex.exec(attrString)) !== null) {
      const [full, key, value] = attrMatch
      // Skip expression props like val={123}
      const afterAttr = attrString.slice(attrMatch.index + full.length)
      if (afterAttr.startsWith('={')) continue
      props[key] = value !== undefined ? value : true
    }
  }

  return { name, props }
}
