var e=`import { describe, it, expect } from 'vitest'

describe('single-entry barrel', () => {
  it('aria-os/ui exports core components', async () => {
    const ui = await import('../ui/index')
    expect(typeof ui.TreeGrid).toBe('function')
    expect(typeof ui.ListBox).toBe('function')
    expect(typeof ui.Combobox).toBe('function')
    expect(typeof ui.TabList).toBe('function')
    expect(typeof ui.RadioGroup).toBe('function')
    expect(typeof ui.Slider).toBe('function')
    expect(typeof ui.DatePicker).toBe('function')
  })

  it('aria-os/ui exports indicators/items/panels/cells/composites namespaces', async () => {
    const ui = await import('../ui/index')
    expect(ui.indicators).toBeDefined()
    expect(ui.items).toBeDefined()
    expect(ui.panels).toBeDefined()
    expect(ui.cells).toBeDefined()
    expect(ui.composites).toBeDefined()
  })

  it('aria-os/layout exports definePage and FlatLayout', async () => {
    const layout = await import('../layout/index')
    expect(typeof layout.definePage).toBe('function')
    expect(typeof layout.FlatLayout).toBe('function')
    expect(typeof layout.createWidgetRegistry).toBe('function')
  })

  it('aria-os/schema exports ROOT_ID and createStore', async () => {
    const schema = await import('../schema/index')
    expect(schema.ROOT_ID).toBeDefined()
    expect(typeof schema.createStore).toBe('function')
  })

  it('aria-os/advanced exports useAria and composePattern (escape hatch)', async () => {
    const advanced = await import('../advanced/index')
    expect(typeof advanced.useAria).toBe('function')
    expect(typeof advanced.composePattern).toBe('function')
    expect(typeof advanced.definePlugin).toBe('function')
  })
})
`;export{e as default};