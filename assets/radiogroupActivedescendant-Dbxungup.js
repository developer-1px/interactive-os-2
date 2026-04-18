var e=`import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { selected } from '../../axis/select'
import { navigate } from '../../axis/navigate'

// APG Radio Group (aria-activedescendant variant)
const nav = navigate('activedescendant')
const sel = selected('single', { followFocus: true })

export const radiogroupActivedescendant: AriaPattern = composePattern(
  { role: 'radiogroup', childRole: 'radio' },
  [nav, sel],
  {
    ArrowDown: nav.nextWrap,
    ArrowUp: nav.prevWrap,
    ArrowRight: nav.nextWrap,
    ArrowLeft: nav.prevWrap,
    Space: sel.toggle,
    Click: sel.selectAndAnchor,
  },
)
`;export{e as default};