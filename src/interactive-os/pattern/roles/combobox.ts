import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { selected } from '../../axis/select'
import { navigate } from '../../axis/navigate'

// APG Combobox — "An input widget with an associated popup."
export interface ComboboxOptions { selectionMode?: 'single' | 'multiple' }

export function combobox(options?: ComboboxOptions): AriaPattern {
  const mode = options?.selectionMode ?? 'single'
  const nav = navigate('activedescendant')
  const sel = selected(mode)

  return composePattern(
    { role: 'combobox', childRole: 'option' },
    [nav, sel],
    {
      ArrowDown: nav.next,
      ArrowUp: nav.prev,
      Home: nav.first,
      End: nav.last,
    },
  )
}
