import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TreeGrid } from '../ui/tree-grid'
import { ListBox } from '../ui/list-box'
import { TabList } from '../ui/tab-list'
import { Accordion } from '../ui/accordion'
import { MenuList } from '../ui/menu-list'
import { DisclosureGroup } from '../ui/disclosure-group'
import { createStore } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'

const treeData = createStore({
  entities: {
    src: { id: 'src', data: { name: 'src' } },
    app: { id: 'app', data: { name: 'App.tsx' } },
  },
  relationships: {
    [ROOT_ID]: ['src'],
    src: ['app'],
  },
})

const listData = createStore({
  entities: {
    a: { id: 'a', data: { label: 'Apple' } },
    b: { id: 'b', data: { label: 'Banana' } },
    c: { id: 'c', data: { label: 'Cherry' } },
  },
  relationships: {
    [ROOT_ID]: ['a', 'b', 'c'],
  },
})

const tabData = createStore({
  entities: {
    tab1: { id: 'tab1', data: { label: 'General' } },
    tab2: { id: 'tab2', data: { label: 'Settings' } },
    tab3: { id: 'tab3', data: { label: 'About' } },
  },
  relationships: {
    [ROOT_ID]: ['tab1', 'tab2', 'tab3'],
  },
})

const accordionData = createStore({
  entities: {
    s1: { id: 's1', data: { label: 'Section 1' } },
    s2: { id: 's2', data: { label: 'Section 2' } },
  },
  relationships: { [ROOT_ID]: ['s1', 's2'] },
})

const menuData = createStore({
  entities: {
    file: { id: 'file', data: { label: 'File' } },
    edit: { id: 'edit', data: { label: 'Edit' } },
    view: { id: 'view', data: { label: 'View' } },
  },
  relationships: { [ROOT_ID]: ['file', 'edit', 'view'] },
})

const disclosureData = createStore({
  entities: {
    details: { id: 'details', data: { label: 'Details' } },
  },
  relationships: { [ROOT_ID]: ['details'] },
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

describe('Accordion reference component', () => {
  it('renders headers', () => {
    render(<Accordion data={accordionData} />)
    expect(screen.getByText('Section 1')).toBeDefined()
    expect(screen.getByText('Section 2')).toBeDefined()
  })

  it('applies region role', () => {
    const { container } = render(<Accordion data={accordionData} />)
    expect(container.querySelector('[role="region"]')).not.toBeNull()
  })
})

describe('MenuList reference component', () => {
  it('renders items', () => {
    render(<MenuList data={menuData} />)
    expect(screen.getByText('File')).toBeDefined()
    expect(screen.getByText('Edit')).toBeDefined()
  })

  it('applies menu role', () => {
    const { container } = render(<MenuList data={menuData} />)
    expect(container.querySelector('[role="menu"]')).not.toBeNull()
  })
})

describe('DisclosureGroup reference component', () => {
  it('renders triggers', () => {
    render(<DisclosureGroup data={disclosureData} />)
    expect(screen.getByText('Details')).toBeDefined()
  })

  it('applies group role', () => {
    const { container } = render(<DisclosureGroup data={disclosureData} />)
    expect(container.querySelector('[role="group"]')).not.toBeNull()
  })
})
