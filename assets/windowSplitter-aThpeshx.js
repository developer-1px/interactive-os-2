var e=`import { composePattern } from '../composePattern'
import { value } from '../../axis/value'
import { navigate } from '../../axis/navigate'

// APG Window Splitter — "A movable separator between two sections."
interface WindowSplitterOptions { min: number; max: number; step: number; orientation?: 'horizontal' | 'vertical' }

export function windowSplitter(options: WindowSplitterOptions) {
  const { min, max, step, orientation = 'horizontal' } = options
  const nav = navigate(orientation)
  const val = value({ min, max, step })

  return composePattern(
    {
      role: 'none',
      childRole: 'separator',
      ariaAttributes: () => ({ 'aria-orientation': orientation }),
    },
    [nav, val],
    {
      ...(orientation === 'horizontal'
        ? { ArrowRight: val.increment, ArrowLeft: val.decrement }
        : { ArrowUp: val.increment, ArrowDown: val.decrement }),
      Home: val.setToMin,
      End: val.setToMax,
    },
  )
}
`;export{e as default};