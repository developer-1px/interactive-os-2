import { describe, it, expect } from 'vitest'
import { parseJsx } from '../pages/parseJsx'

describe('parseJsx', () => {
  it('parses self-closing tag without props', () => {
    expect(parseJsx('<NavigateDemo />')).toEqual({
      name: 'NavigateDemo',
      props: {},
    })
  })

  it('parses self-closing tag with string prop', () => {
    expect(parseJsx('<AxisSpec axis="navigate" />')).toEqual({
      name: 'AxisSpec',
      props: { axis: 'navigate' },
    })
  })

  it('parses boolean flag prop', () => {
    expect(parseJsx('<Demo compact />')).toEqual({
      name: 'Demo',
      props: { compact: true },
    })
  })

  it('parses multiple props', () => {
    expect(parseJsx('<Comp a="1" b="2" flag />')).toEqual({
      name: 'Comp',
      props: { a: '1', b: '2', flag: true },
    })
  })

  it('returns null for non-JSX', () => {
    expect(parseJsx('just text')).toBeNull()
  })

  it('returns null for nested JSX', () => {
    expect(parseJsx('<Outer><Inner /></Outer>')).toBeNull()
  })

  it('ignores expression props', () => {
    expect(parseJsx('<Comp val={123} />')).toEqual({
      name: 'Comp',
      props: {},
    })
  })

  it('trims whitespace', () => {
    expect(parseJsx('  <Demo />  ')).toEqual({
      name: 'Demo',
      props: {},
    })
  })
})
