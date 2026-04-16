/**
 * vitest + happy-dom으로 모든 *.demo.tsx를 렌더링하여 DOM 트리를 덤프한다.
 *
 * 실행: pnpm test -- scripts/dumpDom.test.tsx
 * 출력: scripts/dom-dump.json
 */
import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import fs from 'fs'
import path from 'path'

// eager import all demo modules
const demoModules = import.meta.glob<{
  meta?: { slug?: string; category?: string; label?: string }
  Demo: () => React.ReactNode
}>('/src/interactive-os/ui/**/*.demo.tsx', { eager: true })

/** 재귀적으로 DOM 트리를 간결한 구조로 추출 */
function serializeElement(el: Element, depth = 0): object {
  const tag = el.tagName.toLowerCase()

  // 속성 추출
  const attrs: Record<string, string> = {}
  for (const attr of el.attributes) {
    // class는 너무 길 수 있으므로 축약
    if (attr.name === 'class') {
      attrs.class = attr.value
    } else {
      attrs[attr.name] = attr.value
    }
  }

  // 자식 재귀
  const children: object[] = []
  for (const child of el.children) {
    children.push(serializeElement(child, depth + 1))
  }

  // 텍스트 콘텐츠 (직계 텍스트 노드만, 자식 요소 제외)
  let text = ''
  for (const node of el.childNodes) {
    if (node.nodeType === 3 /* TEXT_NODE */) {
      const t = (node as Text).textContent?.trim()
      if (t) text += t
    }
  }

  const result: Record<string, unknown> = { tag }
  if (Object.keys(attrs).length) result.attrs = attrs
  if (text) result.text = text
  if (children.length) result.children = children

  return result
}

/** DOM 트리를 들여쓰기 텍스트로 변환 */
function treeToText(node: Record<string, unknown>, indent = 0): string {
  const pad = '  '.repeat(indent)
  const tag = node.tag as string
  const attrs = node.attrs as Record<string, string> | undefined
  const text = node.text as string | undefined
  const children = node.children as Record<string, unknown>[] | undefined

  // 속성 문자열 — class, role, aria-*, data-* 만 표시
  const attrParts: string[] = []
  if (attrs) {
    if (attrs.role) attrParts.push(`role="${attrs.role}"`)
    for (const [k, v] of Object.entries(attrs)) {
      if (k.startsWith('aria-') || k.startsWith('data-')) {
        attrParts.push(`${k}="${v.length > 30 ? v.slice(0, 30) + '…' : v}"`)
      }
    }
    if (attrs.class) {
      // ax 클래스만 추출 (sf-, rl-, ly- 등 2글자 접두어)
      const axClasses = attrs.class.split(' ').filter(c => /^[a-z]{2}-/.test(c))
      if (axClasses.length) attrParts.push(`ax=[${axClasses.join(' ')}]`)
      // 비-ax 클래스
      const otherClasses = attrs.class.split(' ').filter(c => c && !/^[a-z]{2}-/.test(c))
      if (otherClasses.length) attrParts.push(`class=[${otherClasses.slice(0, 5).join(' ')}${otherClasses.length > 5 ? '…' : ''}]`)
    }
  }

  const attrStr = attrParts.length ? ' ' + attrParts.join(' ') : ''
  const textStr = text ? ` "${text.slice(0, 20)}"` : ''

  let line = `${pad}<${tag}${attrStr}>${textStr}\n`

  if (children) {
    for (const child of children) {
      line += treeToText(child, indent + 1)
    }
  }

  return line
}

describe('DOM dump', () => {
  it('renders all demos and dumps DOM trees', () => {
    const results: Record<string, { label: string; category: string; html: string; tree: string }> = {}

    for (const [filePath, mod] of Object.entries(demoModules)) {
      if (!mod.Demo) continue

      const slug = path.basename(filePath, '.demo.tsx')

      // 폴더 기반 카테고리
      const after = filePath.replace('/src/interactive-os/ui/', '')
      const folder = after.split('/')[0]
      const folderMap: Record<string, string> = {
        composites: 'composites', indicators: 'indicators',
        items: 'items', cells: 'cells', panels: 'panels',
      }
      const category = folderMap[folder] ?? 'ui'
      const label = mod.meta?.label ?? slug

      try {
        const { container } = render(<mod.Demo />)
        const rootEl = container.firstElementChild
        if (!rootEl) continue

        const tree = serializeElement(rootEl)
        const treeText = treeToText(tree as Record<string, unknown>)

        results[slug] = {
          label,
          category,
          html: container.innerHTML.slice(0, 2000),
          tree: treeText,
        }
      } catch {
        results[slug] = { label, category, html: '[render error]', tree: '[render error]' }
      }
    }

    // JSON 덤프
    fs.writeFileSync('scripts/dom-dump.json', JSON.stringify(results, null, 2))

    // 텍스트 리포트
    const categories: Record<string, string[]> = {}
    for (const [slug, data] of Object.entries(results)) {
      if (!categories[data.category]) categories[data.category] = []
      categories[data.category].push(`\n── ${data.label} (${slug}) ──\n${data.tree}`)
    }

    let report = `aria-os DOM 트리 덤프 — ${Object.keys(results).length}개 컴포넌트\n${'═'.repeat(60)}\n`
    for (const cat of ['ui', 'composites', 'indicators', 'items', 'cells', 'panels']) {
      if (!categories[cat]) continue
      report += `\n${'━'.repeat(40)}\n  ${cat.toUpperCase()} (${categories[cat].length})\n${'━'.repeat(40)}`
      for (const entry of categories[cat].sort()) {
        report += entry + '\n'
      }
    }

    fs.writeFileSync('scripts/dom-dump.txt', report)
    console.log(report)
    console.log(`\n✓ scripts/dom-dump.json + scripts/dom-dump.txt 생성 완료`)
  })
})
