interface KeyCombo {
  key: string
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
}

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

export function parseKeyCombo(combo: string): KeyCombo {
  const parts = combo.split('+')
  const modifiers = parts.slice(0, -1).map((m) => m.toLowerCase())
  let key = parts[parts.length - 1]!

  const hasMod = modifiers.includes('mod')
  const hasCtrl = modifiers.includes('ctrl') || (hasMod && !isMac)
  const hasMeta = modifiers.includes('meta') || (hasMod && isMac)
  const hasShift = modifiers.includes('shift')
  const hasAlt = modifiers.includes('alt')

  if (key.length === 1) key = key.toLowerCase()

  return { key, ctrl: hasCtrl, shift: hasShift, alt: hasAlt, meta: hasMeta }
}

export function matchKeyEvent(event: KeyboardEvent, combo: string): boolean {
  const parsed = parseKeyCombo(combo)

  let eventKey = event.key
  if (eventKey === ' ') eventKey = 'Space'
  if (eventKey.length === 1) eventKey = eventKey.toLowerCase()

  let comboKey = parsed.key
  if (comboKey === 'Space') comboKey = 'Space'

  if (eventKey !== comboKey) return false
  if (event.ctrlKey !== parsed.ctrl) return false
  if (event.shiftKey !== parsed.shift) return false
  if (event.altKey !== parsed.alt) return false
  if (event.metaKey !== parsed.meta) return false

  return true
}

export function findMatchingKey(
  event: KeyboardEvent,
  keyMap: Record<string, unknown>
): string | undefined {
  for (const combo of Object.keys(keyMap)) {
    if (matchKeyEvent(event, combo)) return combo
  }
  return undefined
}
