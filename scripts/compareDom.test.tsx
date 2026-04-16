/**
 * shadcn/ui vs aria-os — happy-dom 실제 렌더 DOM 비교
 *
 * 실행: pnpm test -- scripts/compareDom.test.tsx
 * 출력: scripts/dom-compare.txt
 */
import { describe, it } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import fs from 'fs'

// ── shadcn 컴포넌트 import ──
import { Button as SButton } from './shadcn-ref/button'
import { Badge as SBadge } from './shadcn-ref/badge'
import { Input as SInput } from './shadcn-ref/input'
import { Textarea as STextarea } from './shadcn-ref/textarea'
import { Card as SCard, CardHeader as SCardHeader, CardTitle as SCardTitle, CardDescription as SCardDesc, CardContent as SCardContent, CardFooter as SCardFooter } from './shadcn-ref/card'
import { Alert as SAlert, AlertTitle as SAlertTitle, AlertDescription as SAlertDesc } from './shadcn-ref/alert'
import { Skeleton as SSkeleton } from './shadcn-ref/skeleton'
import { Separator as SSeparator } from './shadcn-ref/separator'
import { Kbd as SKbd } from './shadcn-ref/kbd'
import { Table as STable, TableHeader as STHead, TableBody as STBody, TableRow as STRow, TableHead as STH, TableCell as STD } from './shadcn-ref/table'
import { Toggle as SToggle } from './shadcn-ref/toggle'
import { Label as SLabel } from './shadcn-ref/label'
import { Checkbox as SCheckbox } from './shadcn-ref/checkbox'
import { RadioGroup as SRadioGroup, RadioGroupItem as SRadioGroupItem } from './shadcn-ref/radio-group'
import { Switch as SSwitch } from './shadcn-ref/switch'
import { Progress as SProgress } from './shadcn-ref/progress'
import { Slider as SSlider } from './shadcn-ref/slider'
import { Select as SSelect, SelectTrigger as SSelectTrigger, SelectValue as SSelectValue, SelectContent as SSelectContent, SelectItem as SSelectItem } from './shadcn-ref/select'
import { Tabs as STabs, TabsList as STabsList, TabsTrigger as STabsTrigger, TabsContent as STabsContent } from './shadcn-ref/tabs'
import { Accordion as SAccordion, AccordionItem as SAccordionItem, AccordionTrigger as SAccordionTrigger, AccordionContent as SAccordionContent } from './shadcn-ref/accordion'
import { ScrollArea as SScrollArea } from './shadcn-ref/scroll-area'

// ── aria-os 컴포넌트 import ──
import { Button } from '@os/ui/Button'
import { Badge } from '@os/ui/Badge'
import { TextInput } from '@os/ui/TextInput'
import { Textarea } from '@os/ui/Textarea'
import { Card } from '@os/ui/Card'
import { Skeleton } from '@os/ui/Skeleton'
import { Divider } from '@os/ui/Divider'
import { Kbd } from '@os/ui/Kbd'
import { Toggle } from '@os/ui/Toggle'
import { Table } from '@os/ui/Table'
import { Checkbox } from '@os/ui/Checkbox'
import { RadioGroup } from '@os/ui/RadioGroup'
import { SwitchGroup } from '@os/ui/SwitchGroup'
import { Progress } from '@os/ui/Progress'
import { Slider } from '@os/ui/Slider'
import { Select } from '@os/ui/Select'
import { TabList } from '@os/ui/TabList'
import { Accordion } from '@os/ui/Accordion'
import { ScrollArea } from '@os/ui/ScrollArea'
import { createStore } from '@os/store/createStore'
import { useStore } from '@os/store/useStore'

// ── DOM 트리 직렬화 ──

function serializeEl(el: Element, depth = 0): string {
  const tag = el.tagName.toLowerCase()
  const parts = [tag]

  // 핵심 속성만
  for (const attr of el.attributes) {
    if (attr.name === 'class') {
      const classes = attr.value.split(' ')
      // ax 클래스
      const ax = classes.filter(c => /^[a-z]{2}-/.test(c))
      // tailwind 클래스 (shadcn) — 첫 10개
      const tw = classes.filter(c => !/^[a-z]{2}-/.test(c) && c.length > 0)
      if (ax.length) parts.push(`ax=[${ax.join(' ')}]`)
      if (tw.length) parts.push(`tw=[${tw.slice(0, 12).join(' ')}${tw.length > 12 ? ` +${tw.length - 12}` : ''}]`)
    } else if (attr.name === 'role' || attr.name.startsWith('aria-') || attr.name.startsWith('data-')) {
      if (attr.value.length < 40) parts.push(`${attr.name}="${attr.value}"`)
    }
  }

  // 직계 텍스트
  let text = ''
  for (const node of el.childNodes) {
    if (node.nodeType === 3) {
      const t = (node as Text).textContent?.trim()
      if (t) text += t
    }
  }
  if (text) parts.push(`"${text.slice(0, 25)}"`)

  const pad = '  '.repeat(depth)
  let result = `${pad}<${parts.join(' ')}>\n`

  for (const child of el.children) {
    result += serializeEl(child, depth + 1)
  }
  return result
}

function renderToTree(jsx: React.ReactElement): string {
  try {
    const { container } = render(jsx)
    const el = container.firstElementChild
    if (!el) return '  [empty]\n'
    return serializeEl(el)
  } catch (e) {
    return `  [render error: ${(e as Error).message.slice(0, 80)}]\n`
  }
}

// ── 비교 쌍 정의 ──

interface ComparisonPair {
  name: string
  shadcn: () => React.ReactElement
  ours: () => React.ReactElement
}

function makeStore(items: Record<string, string>) {
  const entities: Record<string, { id: string; data: { label: string } }> = {}
  const rootIds: string[] = []
  for (const [id, label] of Object.entries(items)) {
    entities[id] = { id, data: { label } }
    rootIds.push(id)
  }
  return createStore({ entities, relationships: { __root__: rootIds } })
}

// Toggle wrapper (useStore가 필요)
function OurToggle() {
  const data = makeStore({ bold: 'Bold' })
  const [state, setState] = useStore(data)
  return <Toggle data={state} onChange={setState} />
}

function OurCheckbox() {
  const data = makeStore({ a: 'Option A', b: 'Option B' })
  const [state, setState] = useStore(data)
  return <Checkbox data={state} onChange={setState} aria-label="Check" />
}

function OurRadioGroup() {
  const data = makeStore({ a: 'Option A', b: 'Option B', c: 'Option C' })
  const [state, setState] = useStore(data)
  return <RadioGroup data={state} onChange={setState} aria-label="Radio" />
}

function OurSwitch() {
  const data = makeStore({ wifi: 'Wi-Fi' })
  const [state, setState] = useStore(data)
  return <SwitchGroup data={state} onChange={setState} aria-label="Switch" />
}

function OurSlider() {
  const data = createStore({
    entities: { vol: { id: 'vol', data: { label: 'Volume', value: 50 } } },
    relationships: { __root__: ['vol'] },
  })
  const [state, setState] = useStore(data)
  return <Slider data={state} min={0} max={100} step={1} onChange={setState} />
}

function OurSelect() {
  const data = makeStore({ a: 'Apple', b: 'Banana', c: 'Cherry' })
  return <Select data={data} placeholder="Choose..." aria-label="Fruit" />
}

function OurTabs() {
  const data = makeStore({ a: 'Tab A', b: 'Tab B' })
  return <TabList data={data} aria-label="Tabs" />
}

function OurAccordion() {
  const data = createStore({
    entities: {
      s1: { id: 's1', data: { label: 'Section A' } },
    },
    relationships: { __root__: ['s1'] },
  })
  const [state, setState] = useStore(data)
  return <Accordion data={state} onChange={setState} aria-label="Accordion" />
}

// Table wrapper
function OurTable() {
  const data = createStore({
    entities: {
      body: { id: 'body', data: { label: '' } },
      r1: { id: 'r1', data: { label: '' } },
      c1: { id: 'c1', data: { label: 'Alice' } },
      c2: { id: 'c2', data: { label: 'alice@example.com' } },
    },
    relationships: { __root__: ['body'], body: ['r1'], r1: ['c1', 'c2'] },
  })
  return <Table data={data} aria-label="Users" />
}

const pairs: ComparisonPair[] = [
  {
    name: 'Button',
    shadcn: () => <div><SButton variant="default">Primary</SButton><SButton variant="outline">Outline</SButton><SButton variant="ghost">Ghost</SButton><SButton variant="destructive">Destructive</SButton></div>,
    ours: () => <div><Button variant="accent">Primary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="destructive">Destructive</Button></div>,
  },
  {
    name: 'Badge',
    shadcn: () => <div><SBadge>Default</SBadge><SBadge variant="secondary">Secondary</SBadge><SBadge variant="outline">Outline</SBadge><SBadge variant="destructive">Destructive</SBadge></div>,
    ours: () => <div><Badge>Default</Badge><Badge variant="secondary">Secondary</Badge><Badge variant="outline">Outline</Badge><Badge tone="danger">Destructive</Badge></div>,
  },
  {
    name: 'Input',
    shadcn: () => <SInput placeholder="Enter text..." />,
    ours: () => <TextInput placeholder="Enter text..." />,
  },
  {
    name: 'Textarea',
    shadcn: () => <STextarea placeholder="Write something..." />,
    ours: () => <Textarea value="" onChange={() => {}} placeholder="Write something..." aria-label="Demo" />,
  },
  {
    name: 'Card',
    shadcn: () => <SCard><SCardHeader><SCardTitle>Title</SCardTitle><SCardDesc>Description</SCardDesc></SCardHeader><SCardContent>Content</SCardContent><SCardFooter>Footer</SCardFooter></SCard>,
    ours: () => <Card><Card.Header>Title</Card.Header><Card.Body>Content</Card.Body><Card.Footer>Footer</Card.Footer></Card>,
  },
  {
    name: 'Alert',
    shadcn: () => <SAlert><SAlertTitle>Heads up!</SAlertTitle><SAlertDesc>Something happened.</SAlertDesc></SAlert>,
    ours: () => <div role="alert" style={{ display: 'flex', gap: 8, padding: 12 }}><span>Heads up!</span><span>Something happened.</span></div>,
  },
  {
    name: 'Skeleton',
    shadcn: () => <div><SSkeleton className="h-4 w-full" /><SSkeleton className="h-4 w-3/4" /><SSkeleton className="h-8 w-8 rounded-full" /></div>,
    ours: () => <div><Skeleton shape="text" height="xs" width="full" /><Skeleton shape="text" height="xs" width="lg" /><Skeleton shape="circle" height="md" /></div>,
  },
  {
    name: 'Separator',
    shadcn: () => <div><SSeparator /><SSeparator orientation="vertical" className="h-4" /></div>,
    ours: () => <div><Divider /><Divider direction="vertical" /></div>,
  },
  {
    name: 'Kbd',
    shadcn: () => <div><SKbd>⌘K</SKbd><SKbd>Ctrl+Z</SKbd></div>,
    ours: () => <div><Kbd>⌘K</Kbd><Kbd>Ctrl+Z</Kbd></div>,
  },
  {
    name: 'Table',
    shadcn: () => <STable><STHead><STRow><STH>Name</STH><STH>Email</STH></STRow></STHead><STBody><STRow><STD>Alice</STD><STD>alice@example.com</STD></STRow></STBody></STable>,
    ours: () => <OurTable />,
  },
  {
    name: 'Toggle',
    shadcn: () => <SToggle>Bold</SToggle>,
    ours: () => <OurToggle />,
  },
  {
    name: 'Label',
    shadcn: () => <SLabel>Email</SLabel>,
    ours: () => <label>Email</label>,
  },
  {
    name: 'Checkbox',
    shadcn: () => <div><SCheckbox /><SCheckbox defaultChecked /></div>,
    ours: () => <OurCheckbox />,
  },
  {
    name: 'RadioGroup',
    shadcn: () => <SRadioGroup defaultValue="a"><SRadioGroupItem value="a" /><SRadioGroupItem value="b" /><SRadioGroupItem value="c" /></SRadioGroup>,
    ours: () => <OurRadioGroup />,
  },
  {
    name: 'Switch',
    shadcn: () => <div><SSwitch /><SSwitch defaultChecked /></div>,
    ours: () => <OurSwitch />,
  },
  {
    name: 'Progress',
    shadcn: () => <SProgress value={60} />,
    ours: () => <Progress value={60} tone="accent" aria-label="60%" />,
  },
  {
    name: 'Slider',
    shadcn: () => <SSlider defaultValue={[50]} max={100} step={1} />,
    ours: () => <OurSlider />,
  },
  {
    name: 'Select',
    shadcn: () => <SSelect><SSelectTrigger><SSelectValue placeholder="Choose..." /></SSelectTrigger></SSelect>,
    ours: () => <OurSelect />,
  },
  {
    name: 'Tabs',
    shadcn: () => <STabs defaultValue="a"><STabsList><STabsTrigger value="a">Tab A</STabsTrigger><STabsTrigger value="b">Tab B</STabsTrigger></STabsList><STabsContent value="a">Content A</STabsContent></STabs>,
    ours: () => <OurTabs />,
  },
  {
    name: 'Accordion',
    shadcn: () => <SAccordion type="single" collapsible><SAccordionItem value="a"><SAccordionTrigger>Section A</SAccordionTrigger><SAccordionContent>Content A</SAccordionContent></SAccordionItem></SAccordion>,
    ours: () => <OurAccordion />,
  },
  {
    name: 'ScrollArea',
    shadcn: () => <SScrollArea className="h-20"><div>Scrollable content</div></SScrollArea>,
    ours: () => <ScrollArea><div>Scrollable content</div></ScrollArea>,
  },
]

// ── GAP 분석 ──

function analyzeDomDiff(shadcnTree: string, oursTree: string): string[] {
  const gaps: string[] = []

  // 태그 추출
  const extractTags = (tree: string) => [...tree.matchAll(/<(\w+)/g)].map(m => m[1])
  const sTags = extractTags(shadcnTree)
  const oTags = extractTags(oursTree)

  // 시맨틱 vs div 비교
  const semantics = ['nav', 'ol', 'ul', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'label', 'fieldset', 'button', 'kbd', 'a']
  for (const tag of semantics) {
    const sCount = sTags.filter(t => t === tag).length
    const oCount = oTags.filter(t => t === tag).length
    if (sCount > 0 && oCount === 0) gaps.push(`<${tag}> 누락 (shadcn ${sCount}개)`)
    else if (sCount > oCount) gaps.push(`<${tag}> 부족 (shadcn ${sCount} vs 우리 ${oCount})`)
  }

  // div 비율
  const oDivs = oTags.filter(t => t === 'div').length
  const sDivs = sTags.filter(t => t === 'div').length
  if (oTags.length > 2 && oDivs > sDivs + 2) {
    gaps.push(`div 과다 (우리 ${oDivs} vs shadcn ${sDivs})`)
  }

  // tw 클래스 키워드
  const twClasses = [...shadcnTree.matchAll(/tw=\[([^\]]+)\]/g)].map(m => m[1]).join(' ')
  const axClasses = [...oursTree.matchAll(/ax=\[([^\]]+)\]/g)].map(m => m[1]).join(' ')

  // shadow
  if (twClasses.includes('shadow') && !axClasses.includes('sf-raised') && !axClasses.includes('sf-overlay') && !axClasses.includes('bd-ring') && !axClasses.includes('sf-input') && !axClasses.includes('sf-action') && !axClasses.includes('sf-display') && !axClasses.includes('ia-check') && !axClasses.includes('rl-control')) {
    gaps.push('shadow 누락')
  }

  // border
  if (twClasses.includes('border') && !axClasses.includes('bd-') && !axClasses.includes('sf-input') && !axClasses.includes('sf-display')) {
    gaps.push('border 누락')
  }

  // data-slot vs role
  const slots = [...shadcnTree.matchAll(/data-slot="([^"]+)"/g)].map(m => m[1])
  const roles = [...oursTree.matchAll(/role="([^"]+)"/g)].map(m => m[1])
  if (slots.length > roles.length + 1) {
    gaps.push(`part 구조 차이: shadcn ${slots.length} parts (${slots.join(', ')}) vs 우리 ${roles.length} roles`)
  }

  return gaps
}

// ── 테스트 ──

describe('shadcn vs aria-os DOM 비교', () => {
  it('모든 컴포넌트 쌍을 렌더링하고 비교', () => {
    const lines: string[] = []
    let gapCount = 0

    lines.push('═'.repeat(70))
    lines.push('  shadcn/ui vs aria-os — happy-dom 실제 렌더 DOM 비교')
    lines.push('═'.repeat(70))

    for (const pair of pairs) {
      lines.push('')
      lines.push('─'.repeat(60))
      lines.push(`  ${pair.name}`)
      lines.push('─'.repeat(60))

      const shadcnTree = renderToTree(pair.shadcn())
      const oursTree = renderToTree(pair.ours())

      lines.push('')
      lines.push('  ◼ shadcn:')
      lines.push(shadcnTree.split('\n').map(l => '    ' + l).join('\n'))

      lines.push('  ◼ aria-os:')
      lines.push(oursTree.split('\n').map(l => '    ' + l).join('\n'))

      const gaps = analyzeDomDiff(shadcnTree, oursTree)
      if (gaps.length) {
        gapCount++
        lines.push('  ◼ GAP:')
        for (const g of gaps) lines.push(`    • ${g}`)
      } else {
        lines.push('  ✅ OK')
      }
    }

    lines.push('')
    lines.push('═'.repeat(70))
    lines.push(`  요약: ${pairs.length}개 중 ${gapCount}개 갭`)
    lines.push('═'.repeat(70))

    const report = lines.join('\n') + '\n'
    fs.writeFileSync('scripts/dom-compare.txt', report)
    console.log(report)
  })
})
