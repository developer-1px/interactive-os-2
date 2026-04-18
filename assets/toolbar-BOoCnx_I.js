var e=`import { composePattern } from '../composePattern'
import { navigate } from '../../axis/navigate'
import { checked } from '../../axis/checked'
import { activateHandler } from '../../axis/activate'

// APG Toolbar — "A container for grouping a set of controls."
// toggle: true → all buttons are toggle buttons with aria-pressed

export function toolbar(opts?: { toggle?: boolean }) {
  const nav = navigate('horizontal')

  if (opts?.toggle) {
    const chk = checked()
    return composePattern(
      { role: 'toolbar', childRole: 'button' },
      [nav, chk],
      {
        ArrowRight: nav.nextWrap,
        ArrowLeft: nav.prevWrap,
        Home: nav.first,
        End: nav.last,
        Enter: chk.toggle,
        Space: chk.toggle,
        Click: chk.toggle,
      },
    )
  }

  return composePattern(
    { role: 'toolbar', childRole: 'button' },
    [nav],
    {
      ArrowRight: nav.nextWrap,
      ArrowLeft: nav.prevWrap,
      Home: nav.first,
      End: nav.last,
      Enter: activateHandler,
      Space: activateHandler,
      Click: activateHandler,
    },
  )
}
`;export{e as default};