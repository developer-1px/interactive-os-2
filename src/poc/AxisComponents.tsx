// ── Axis Components — style={} 0개. ax()만으로 컴포넌트 디자인. ──

import React from 'react'
import { ax } from './ax'
import './ax.css'

// ════════════════════════════════════════════
// Primitives — 가장 작은 단위
// ════════════════════════════════════════════

function Button({ tone = 'neutral' as const, size = 'md' as const, children, ...props }: {
  tone?: 'primary' | 'destructive' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={ax({
      surface: 'action', controlSize: size, interaction: 'action',
      tone, proximity: 'inline',
    })} {...props}>
      {children}
    </button>
  )
}

function IconButton({ children, ...props }: {
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={ax({
      surface: 'action', controlSize: 'sm', tone: 'neutral',
      layout: 'center',
    })} {...props}>
      {children}
    </button>
  )
}

function TextInput({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <label className={ax({ layout: 'column', proximity: 'inline' })}>
      <span className={ax({ textStyle: 'caption', text: 'muted' })}>{label}</span>
      <input
        className={ax({ surface: 'input', controlSize: 'lg', interaction: 'input' })}
        placeholder={placeholder}
      />
    </label>
  )
}

function Badge({ children, tone = 'neutral' as const }: {
  children: React.ReactNode
  tone?: 'primary' | 'success' | 'warning' | 'destructive' | 'neutral'
}) {
  return (
    <span className={ax({
      surface: 'action', controlSize: 'sm', interaction: 'input',
      tone, textStyle: 'caption',
    })}>
      {children}
    </span>
  )
}

// ════════════════════════════════════════════
// Navigation — 탐색 요소
// ════════════════════════════════════════════

function NavItem({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={ax({
        surface: 'ghost', controlSize: 'md', interaction: 'nav',
        proximity: 'inline', text: active ? 'primary' : 'secondary',
      })}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </div>
  )
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <nav className={ax({ layout: 'column', padding: 'element', proximity: 'inline', overflow: 'auto' })}>
      {children}
    </nav>
  )
}

function TabBar({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({ layout: 'row', proximity: 'inline', padding: 'inline' })} role="tablist">
      {children}
    </div>
  )
}

function Tab({ selected, children }: { selected?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={ax({
        surface: 'ghost', controlSize: 'sm', interaction: 'nav',
        proximity: 'inline', text: selected ? 'primary' : 'muted',
      })}
      role="tab"
      aria-selected={selected}
    >
      {children}
    </div>
  )
}

// ════════════════════════════════════════════
// Content — 콘텐츠 표시
// ════════════════════════════════════════════

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={ax({ surface: 'display', layout: 'column', proximity: 'group', padding: 'section' })}>
      <h3 className={ax({ textStyle: 'section', text: 'primary' })}>{title}</h3>
      {children}
    </div>
  )
}

function ListItem({ selected, children }: { selected?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={ax({
        surface: 'ghost', controlSize: 'md', interaction: 'nav',
        proximity: 'inline', text: 'primary',
      })}
      role="option"
      aria-selected={selected}
    >
      {children}
    </div>
  )
}

function ListBox({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({ layout: 'column' })} role="listbox">
      {children}
    </div>
  )
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({ layout: 'row', proximity: 'inline', align: 'center' })} role="toolbar">
      {children}
    </div>
  )
}

function Dialog({ title, children, actions }: {
  title: string
  children: React.ReactNode
  actions: React.ReactNode
}) {
  return (
    <div className={ax({ surface: 'overlay', layout: 'column', proximity: 'section', padding: 'page', width: 'md' })}>
      <h2 className={ax({ textStyle: 'section', text: 'primary' })}>{title}</h2>
      <div className={ax({ layout: 'column', proximity: 'group' })}>
        {children}
      </div>
      <div className={ax({ layout: 'row', proximity: 'element', justify: 'end' })}>
        {actions}
      </div>
    </div>
  )
}

function MenuList({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({ surface: 'overlay', layout: 'column', padding: 'inline', width: 'sm' })}>
      {children}
    </div>
  )
}

function MenuItem({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({
      surface: 'ghost', controlSize: 'md', interaction: 'nav',
      proximity: 'inline', text: 'primary',
    })} role="menuitem">
      {children}
    </div>
  )
}

// ════════════════════════════════════════════
// Composed — 실제 화면 조합
// ════════════════════════════════════════════

function AppHeader() {
  return (
    <div className={ax({ layout: 'row', align: 'center', justify: 'between', padding: 'element' })}>
      <div className={ax({ layout: 'row', proximity: 'element', align: 'center' })}>
        <span className={ax({ textStyle: 'section', text: 'primary' })}>Aria</span>
        <TabBar>
          <Tab selected>Overview</Tab>
          <Tab>Components</Tab>
          <Tab>Settings</Tab>
        </TabBar>
      </div>
      <Toolbar>
        <IconButton>🔍</IconButton>
        <IconButton>⚙</IconButton>
      </Toolbar>
    </div>
  )
}

function AppSidebar() {
  return (
    <Sidebar>
      <span className={ax({ textStyle: 'caption', text: 'muted', padding: 'element' })}>Navigation</span>
      <NavItem active>Dashboard</NavItem>
      <NavItem>Components</NavItem>
      <NavItem>Patterns</NavItem>
      <NavItem>Tokens</NavItem>
      <span className={ax({ textStyle: 'caption', text: 'muted', padding: 'element' })}>Tools</span>
      <NavItem>Inspector</NavItem>
      <NavItem>Test Runner</NavItem>
    </Sidebar>
  )
}

function TaskCard() {
  return (
    <Card title="Active Tasks">
      <ListBox>
        <ListItem selected>Migrate to axis system</ListItem>
        <ListItem>Remove Panda CSS dependency</ListItem>
        <ListItem>Update CLAUDE.md</ListItem>
      </ListBox>
    </Card>
  )
}

function StatsCard() {
  return (
    <Card title="Design System">
      <div className={ax({ layout: 'row', proximity: 'group' })}>
        <div className={ax({ layout: 'column', proximity: 'inline', flex: '1' })}>
          <span className={ax({ textStyle: 'page', text: 'primary' })}>15</span>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>Axis values</span>
        </div>
        <div className={ax({ layout: 'column', proximity: 'inline', flex: '1' })}>
          <span className={ax({ textStyle: 'page', text: 'primary' })}>~50</span>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>CSS classes</span>
        </div>
        <div className={ax({ layout: 'column', proximity: 'inline', flex: '1' })}>
          <span className={ax({ textStyle: 'page', text: 'primary' })}>0</span>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>style= usage</span>
        </div>
      </div>
    </Card>
  )
}

function FormCard() {
  return (
    <Card title="New Component">
      <div className={ax({ layout: 'column', proximity: 'group' })}>
        <TextInput label="Name" placeholder="e.g. TabGroup" />
        <TextInput label="Surface" placeholder="e.g. ghost" />
        <div className={ax({ layout: 'row', proximity: 'element' })}>
          <Badge tone="primary">Interactive</Badge>
          <Badge tone="success">Accessible</Badge>
          <Badge tone="warning">WIP</Badge>
        </div>
      </div>
      <div className={ax({ layout: 'row', proximity: 'element', justify: 'end' })}>
        <Button tone="neutral">Cancel</Button>
        <Button tone="primary">Create</Button>
      </div>
    </Card>
  )
}

function SampleDialog() {
  return (
    <Dialog
      title="Delete Component?"
      actions={<>
        <Button tone="neutral">Cancel</Button>
        <Button tone="destructive">Delete</Button>
      </>}
    >
      <p className={ax({ textStyle: 'body', text: 'secondary' })}>
        This action cannot be undone. The component and all its variants will be permanently removed.
      </p>
    </Dialog>
  )
}

function SampleMenu() {
  return (
    <MenuList>
      <MenuItem>New File</MenuItem>
      <MenuItem>Open Folder</MenuItem>
      <MenuItem>Save As...</MenuItem>
      <MenuItem>Export PDF</MenuItem>
    </MenuList>
  )
}

// ════════════════════════════════════════════
// Full Page — 전체 레이아웃
// ════════════════════════════════════════════

export function AxisComponents() {
  return (
    <div className={ax({ layout: 'column', width: 'full' })}>
      <AppHeader />
      <div className={ax({ layout: 'row', flex: '1' })}>
        <AppSidebar />
        <main className={ax({ layout: 'column', proximity: 'page', padding: 'page', flex: '1', overflow: 'auto' })}>

          <div className={ax({ layout: 'column', proximity: 'element' })}>
            <h1 className={ax({ textStyle: 'page', text: 'primary' })}>Dashboard</h1>
            <p className={ax({ textStyle: 'body', text: 'secondary' })}>
              All components below use ax() only. Zero style attributes.
            </p>
          </div>

          <div className={ax({ layout: 'row', proximity: 'section' })}>
            <div className={ax({ layout: 'column', proximity: 'section', flex: '1' })}>
              <StatsCard />
              <TaskCard />
              <FormCard />
            </div>
            <div className={ax({ layout: 'column', proximity: 'section' })}>
              <SampleDialog />
              <SampleMenu />
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
