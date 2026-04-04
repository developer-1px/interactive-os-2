// V1-V7: 2026-04-04-command-binding-registry-prd.md
import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerBinding,
  unregisterBindings,
  unregisterBinding,
  byNode,
  byCommand,
  clearAllBindings,
} from '../interactive-os/primitives/bindingRegistry'

beforeEach(() => {
  clearAllBindings()
})

// V1: clickMap auto-registration produces correct byNode results
describe('byNode', () => {
  it('returns bindings for a given nodeId', () => {
    registerBinding({ command: 'select:selectAndAnchor', nodeId: 'item-1', input: 'Click' })
    registerBinding({ command: 'select:extendToFocused', nodeId: 'item-1', input: 'Shift+Click' })
    registerBinding({ command: 'select:toggle', nodeId: 'item-1', input: 'Mod+Click' })

    const result = byNode('item-1')
    expect(result).toHaveLength(3)
    expect(result.map(r => r.input)).toEqual(['Click', 'Shift+Click', 'Mod+Click'])
  })
})

// V2: byCommand returns correct element+input pairs
describe('byCommand', () => {
  it('returns all nodes that trigger a command', () => {
    registerBinding({ command: 'tab:close', nodeId: 'close-btn-1', input: 'Click' })
    registerBinding({ command: 'tab:close', nodeId: 'close-btn-2', input: 'Click' })
    registerBinding({ command: 'tab:activate', nodeId: 'tab-1', input: 'Click' })

    const result = byCommand('tab:close')
    expect(result).toHaveLength(2)
    expect(result.map(r => r.nodeId)).toEqual(['close-btn-1', 'close-btn-2'])
  })
})

// V3: cleanup on unmount
describe('unregisterBinding', () => {
  it('removes a specific binding', () => {
    const entry = { command: 'tab:close', nodeId: 'btn', input: 'Click' }
    registerBinding(entry)
    expect(byCommand('tab:close')).toHaveLength(1)

    unregisterBinding(entry)
    expect(byCommand('tab:close')).toHaveLength(0)
  })
})

describe('unregisterBindings', () => {
  it('removes all bindings for a nodeId', () => {
    registerBinding({ command: 'a', nodeId: 'n1', input: 'Click' })
    registerBinding({ command: 'b', nodeId: 'n1', input: 'Shift+Click' })
    registerBinding({ command: 'c', nodeId: 'n2', input: 'Click' })

    unregisterBindings('n1')
    expect(byNode('n1')).toHaveLength(0)
    expect(byNode('n2')).toHaveLength(1)
  })
})

// V4: multiple commands per node
describe('multiple commands per node', () => {
  it('accumulates distinct command bindings', () => {
    registerBinding({ command: 'cmd-a', nodeId: 'n1', input: 'Click' })
    registerBinding({ command: 'cmd-b', nodeId: 'n1', input: 'DblClick' })

    expect(byNode('n1')).toHaveLength(2)
  })
})

// V5: idempotent — duplicate tuple ignored
describe('idempotent registration', () => {
  it('ignores duplicate tuples', () => {
    const entry = { command: 'x', nodeId: 'n', input: 'Click' }
    registerBinding(entry)
    registerBinding(entry)
    registerBinding(entry)

    expect(byNode('n')).toHaveLength(1)
  })
})

// V6: global binding (null nodeId)
describe('global binding', () => {
  it('supports null nodeId for global shortcuts', () => {
    registerBinding({ command: 'route:save', nodeId: null, input: 'Mod+S' })

    const result = byCommand('route:save')
    expect(result).toHaveLength(1)
    expect(result[0].nodeId).toBeNull()
    expect(result[0].input).toBe('Mod+S')
  })
})

// V7: axis auto-registered + manual coexist
describe('mixed auto + manual bindings', () => {
  it('byNode returns both axis and manual bindings merged', () => {
    // Simulate axis auto-registration
    registerBinding({ command: 'select:selectAndAnchor', nodeId: 'listbox', input: 'Click' })
    registerBinding({ command: 'navigate:focusNext', nodeId: 'listbox', input: 'ArrowDown' })
    // Simulate manual useCommand registration
    registerBinding({ command: 'listbox:customAction', nodeId: 'listbox', input: 'DblClick' })

    const result = byNode('listbox')
    expect(result).toHaveLength(3)
    expect(result.map(r => r.command)).toContain('select:selectAndAnchor')
    expect(result.map(r => r.command)).toContain('navigate:focusNext')
    expect(result.map(r => r.command)).toContain('listbox:customAction')
  })
})
