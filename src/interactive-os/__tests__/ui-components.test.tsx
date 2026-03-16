import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TreeGrid } from '../ui/tree-grid'
import { ListBox } from '../ui/list-box'
import { TabList } from '../ui/tab-list'
import { createStore } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'

const treeData = createStore({
  entities: {
    src: { id: 'src', name: 'src' },
    app: { id: 'app', name: 'App.tsx' },
  },
  relationships: {
    [ROOT_ID]: ['src'],
    src: ['app'],
  },
})

const listData = createStore({
  entities: {
    a: { id: 'a', label: 'Apple' },
    b: { id: 'b', label: 'Banana' },
    c: { id: 'c', label: 'Cherry' },
  },
  relationships: {
    [ROOT_ID]: ['a', 'b', 'c'],
  },
})

const tabData = createStore({
  entities: {
    tab1: { id: 'tab1', label: 'General' },
    tab2: { id: 'tab2', label: 'Settings' },
    tab3: { id: 'tab3', label: 'About' },
  },
  relationships: {
    [ROOT_ID]: ['tab1', 'tab2', 'tab3'],
  },
})

describe('TreeGrid reference component', () => {
  it('renders with default render function', () => {
    render(<TreeGrid data={treeData} />)
    expect(screen.getByText('src')).toBeDefined()
  })

  it('applies treegrid role', () => {
    const { container } = render(<TreeGrid data={treeData} />)
    expect(container.querySelector('[role="treegrid"]')).not.toBeNull()
  })
})

describe('ListBox reference component', () => {
  it('renders items', () => {
    render(<ListBox data={listData} />)
    expect(screen.getByText('Apple')).toBeDefined()
    expect(screen.getByText('Banana')).toBeDefined()
    expect(screen.getByText('Cherry')).toBeDefined()
  })

  it('applies listbox role', () => {
    const { container } = render(<ListBox data={listData} />)
    expect(container.querySelector('[role="listbox"]')).not.toBeNull()
  })
})

describe('TabList reference component', () => {
  it('renders tabs', () => {
    render(<TabList data={tabData} />)
    expect(screen.getByText('General')).toBeDefined()
    expect(screen.getByText('Settings')).toBeDefined()
    expect(screen.getByText('About')).toBeDefined()
  })

  it('applies tablist role', () => {
    const { container } = render(<TabList data={tabData} />)
    expect(container.querySelector('[role="tablist"]')).not.toBeNull()
  })
})
