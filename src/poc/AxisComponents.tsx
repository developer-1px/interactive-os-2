// ── Axis Components — style={} 0개. ax()만으로 컴포넌트 디자인. ──

import React from 'react'
import { ax } from './ax'
import './ax.css'

// ════════════════════════════════════════════
// Primitives — 가장 작은 단위
// ════════════════════════════════════════════

function Button({ tone = 'neutral' as const, size = 'md' as const, children, ...props }: {
  tone?: 'accent' | 'danger' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={ax({
      surface: 'action', controlSize: size, tone,
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
    })} {...props}>
      {children}
    </button>
  )
}

function TextInput({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <label className={ax({ layout: 'column', gap: 'xs' })}>
      <span className={ax({ textStyle: 'caption', text: 'muted' })}>{label}</span>
      <input
        className={ax({ surface: 'input', controlSize: 'lg' })}
        placeholder={placeholder}
      />
    </label>
  )
}

function Badge({ children, tone = 'neutral' as const }: {
  children: React.ReactNode
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral'
}) {
  return (
    <span className={ax({
      surface: 'action', controlSize: 'sm', tone, textStyle: 'caption',
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
        surface: 'ghost', controlSize: 'md',
        text: active ? 'primary' : 'secondary',
      })}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </div>
  )
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <nav className={ax({ layout: 'scroll', gap: 'xs', padding: 'sm' })}>
      {children}
    </nav>
  )
}

function TabBar({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({ layout: 'bar', gap: 'xs', padding: 'xs' })} role="tablist">
      {children}
    </div>
  )
}

function Tab({ selected, children }: { selected?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={ax({
        surface: 'ghost', controlSize: 'sm',
        text: selected ? 'primary' : 'muted',
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
    <div className={ax({ surface: 'display', layout: 'column', gap: 'md', padding: 'lg' })}>
      <h3 className={ax({ textStyle: 'section', text: 'primary' })}>{title}</h3>
      {children}
    </div>
  )
}

function ListItem({ selected, children }: { selected?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={ax({
        surface: 'ghost', controlSize: 'md', text: 'primary',
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
    <div className={ax({ layout: 'bar', gap: 'xs' })} role="toolbar">
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
    <div className={ax({ surface: 'overlay', layout: 'column', gap: 'lg', padding: 'xl', width: 'md' })}>
      <h2 className={ax({ textStyle: 'section', text: 'primary' })}>{title}</h2>
      <div className={ax({ layout: 'column', gap: 'md' })}>
        {children}
      </div>
      <div className={ax({ layout: 'bar', gap: 'sm' })}>
        <div className={ax({ flex: '1' })} />
        {actions}
      </div>
    </div>
  )
}

function MenuList({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({ surface: 'overlay', layout: 'column', padding: 'xs', width: 'sm' })}>
      {children}
    </div>
  )
}

function MenuItem({ children }: { children: React.ReactNode }) {
  return (
    <div className={ax({
      surface: 'ghost', controlSize: 'md', text: 'primary',
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
    <div className={ax({ layout: 'spread', padding: 'sm' })}>
      <div className={ax({ layout: 'bar', gap: 'sm' })}>
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
      <span className={ax({ textStyle: 'caption', text: 'muted', padding: 'sm' })}>Navigation</span>
      <NavItem active>Dashboard</NavItem>
      <NavItem>Components</NavItem>
      <NavItem>Patterns</NavItem>
      <NavItem>Tokens</NavItem>
      <span className={ax({ textStyle: 'caption', text: 'muted', padding: 'sm' })}>Tools</span>
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
      <div className={ax({ layout: 'bar', gap: 'md' })}>
        <div className={ax({ layout: 'column', gap: 'xs', flex: '1' })}>
          <span className={ax({ textStyle: 'page', text: 'primary' })}>10</span>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>Axes</span>
        </div>
        <div className={ax({ layout: 'column', gap: 'xs', flex: '1' })}>
          <span className={ax({ textStyle: 'page', text: 'primary' })}>~40</span>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>CSS classes</span>
        </div>
        <div className={ax({ layout: 'column', gap: 'xs', flex: '1' })}>
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
      <div className={ax({ layout: 'column', gap: 'md' })}>
        <TextInput label="Name" placeholder="e.g. TabGroup" />
        <TextInput label="Surface" placeholder="e.g. ghost" />
        <div className={ax({ layout: 'bar', gap: 'sm' })}>
          <Badge tone="accent">Interactive</Badge>
          <Badge tone="success">Accessible</Badge>
          <Badge tone="warning">WIP</Badge>
        </div>
      </div>
      <div className={ax({ layout: 'bar', gap: 'sm' })}>
        <div className={ax({ flex: '1' })} />
        <Button tone="neutral">Cancel</Button>
        <Button tone="accent">Create</Button>
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
        <Button tone="danger">Delete</Button>
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
        <main className={ax({ layout: 'column', gap: 'xl', padding: 'xl', flex: '1' })}>

          <div className={ax({ layout: 'column', gap: 'sm' })}>
            <h1 className={ax({ textStyle: 'page', text: 'primary' })}>Dashboard</h1>
            <p className={ax({ textStyle: 'body', text: 'secondary' })}>
              All components below use ax() only. Zero style attributes.
            </p>
          </div>

          <div className={ax({ layout: 'row', gap: 'lg' })}>
            <div className={ax({ layout: 'column', gap: 'lg', flex: '1' })}>
              <StatsCard />
              <TaskCard />
              <FormCard />
            </div>
            <div className={ax({ layout: 'column', gap: 'lg' })}>
              <SampleDialog />
              <SampleMenu />
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
