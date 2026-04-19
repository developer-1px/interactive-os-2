/* eslint-disable react-refresh/only-export-components */
// ② code-viewer-prd.md
import { CodeViewer, type HighlightTone } from './CodeViewer'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'code-viewer',
  category: 'ui',
  label: 'CodeViewer',
}

const code = `import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

const data = createStore({
  entities: { a: { id: 'a', data: { label: 'Hello' } } },
  relationships: { [ROOT_ID]: ['a'] },
})`

const longCode = `.sidebarHeader {
  height: 36px;
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 600;
}`

const consecutive = new Map<number, HighlightTone>([
  [1, 'inserted'],
  [2, 'inserted'],
  [3, 'inserted'],
  [4, 'inserted'],
])

const mixed = new Map<number, HighlightTone>([
  [1, 'inserted'],
  [3, 'deleted'],
  [5, 'edited'],
  [7, 'selected'],
])

const consecutiveDeleted = new Map<number, HighlightTone>([
  [1, 'deleted'],
  [2, 'deleted'],
  [3, 'deleted'],
  [4, 'deleted'],
])

export function Demo() {
  return (
    <div className={ax({ layout: 'stack' })}>
      <Section label="preset=doc (default) — filename + region landmark">
        <CodeViewer code={code} filename="example.ts" preset="doc" />
      </Section>

      <Section label="preset=presentation — mac chrome + large font">
        <CodeViewer code={code} filename="app.tsx" preset="presentation" />
      </Section>

      <Section label="preset=chat — compact + wrap + no line numbers">
        <CodeViewer code={code} preset="chat" />
      </Section>

      <Section label="preset=replay — compact + line numbers, plain figure">
        <CodeViewer code={longCode} filename="styles.css" preset="replay" highlightLines={mixed} />
      </Section>

      <Section label="consecutive deleted (stronger tone)">
        <CodeViewer code={longCode} filename="styles.css" highlightLines={consecutiveDeleted} />
      </Section>

      <Section label="consecutive inserted">
        <CodeViewer code={longCode} filename="styles.css" highlightLines={consecutive} />
      </Section>

      <Section label="mixed tones: inserted(1) / deleted(3) / edited(5) / selected(7)">
        <CodeViewer code={longCode} filename="styles.css" highlightLines={mixed} />
      </Section>

      <Section label="startLine=42 — gutter starts at 42">
        <CodeViewer code={code} filename="example.ts" startLine={42} />
      </Section>

      <Section label="no filename — aria-label='Code example, typescript'">
        <CodeViewer code={code} preset="doc" />
      </Section>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className={ax({ textStyle: 'caption' })}>{label}</div>
      {children}
    </div>
  )
}
