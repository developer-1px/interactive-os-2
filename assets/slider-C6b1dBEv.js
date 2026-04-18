var e=`import { composePattern } from '../composePattern'
import { value } from '../../axis/value'
import { navigate } from '../../axis/navigate'

// APG Slider — "An input where the user selects a value from within a given range."
interface SliderOptions { min: number; max: number; step: number; orientation?: 'horizontal' | 'vertical' }

export function slider(options: SliderOptions) {
  const { min, max, step, orientation = 'horizontal' } = options
  const nav = navigate('natural')
  const val = value({ min, max, step })

  return composePattern(
    { role: 'none', childRole: 'slider' },
    [nav, val],
    {
      ArrowUp: val.increment,
      ArrowDown: val.decrement,
      ...(orientation === 'horizontal' && {
        ArrowRight: val.increment,
        ArrowLeft: val.decrement,
      }),
      Home: val.setToMin,
      End: val.setToMax,
      PageUp: val.incrementBig,
      PageDown: val.decrementBig,
    },
  )
}
`;export{e as default};