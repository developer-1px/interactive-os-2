import { composePattern } from '../composePattern'
import { value } from '../../axis/value'
import { navigate } from '../../axis/navigate'

// APG Spinbutton — "A rangeable input for numeric values."
interface SpinbuttonOptions { min: number; max: number; step: number }

export function spinbutton(options: SpinbuttonOptions) {
  const nav = navigate('natural')
  const val = value(options)

  return composePattern(
    { role: 'none', childRole: 'spinbutton' },
    [nav, val],
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
