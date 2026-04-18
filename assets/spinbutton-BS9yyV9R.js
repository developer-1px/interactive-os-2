var e=`import { composePattern } from '../composePattern'
import { value } from '../../axis/value'
import { navigate } from '../../axis/navigate'
import { edit } from '../../axis/edit'

// APG Spinbutton — "A rangeable input for numeric values."
interface SpinbuttonOptions { min: number; max: number; step: number }

export function spinbutton(options: SpinbuttonOptions) {
  const nav = navigate('natural')
  const val = value(options)
  const ed = edit()

  return composePattern(
    { role: 'none', childRole: 'spinbutton' },
    [nav, val, ed],
    {
      ArrowUp: val.increment,
      ArrowDown: val.decrement,
      Home: val.setToMin,
      End: val.setToMax,
      PageUp: val.incrementBig,
      PageDown: val.decrementBig,
    },
  )
}
`;export{e as default};