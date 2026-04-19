// ② inspectorDefinePagePanelPrd.md
import type { NormalizedData } from '@os/store/types'

function jsonWithUnquotedKeys(value: unknown, indent: number): string {
  const raw = JSON.stringify(value, null, 2)
  const reIndent = raw.split('\n').map((line, i) => i === 0 ? line : ' '.repeat(indent) + line).join('\n')
  return reIndent.replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')
}

/**
 * NormalizedData (definePage 결과) → `definePage({ entities: {...} })` TS 코드 문자열.
 * - 2-space indent, JSON.stringify 기반 + 키 언쿼트
 * - ROOT_ID 메타 relationship은 생략 (children 필드로 복원됨)
 * - __-prefixed 메타 entity(FOCUS_STATE_ID 등)는 skip
 *
 * @invariant 반환 문자열은 eval 대상이 아니라 클립보드 paste용; 사용자가 수동 정리 전제
 */
export function serializeToDefinePage(store: NormalizedData): string {
  const lines: string[] = ['definePage({', '  entities: {']
  const ids = Object.keys(store.entities).filter(id => !id.startsWith('__'))
  for (const id of ids) {
    const entity = store.entities[id]
    const data = (entity?.data ?? {}) as Record<string, unknown>
    const { label: _label, ...cleanData } = data
    const children = store.relationships[id]?.filter(c => !c.startsWith('__')) ?? []
    lines.push(`    ${id}: {`)
    lines.push(`      data: ${jsonWithUnquotedKeys(cleanData, 6)},`)
    if (children.length > 0) {
      lines.push(`      children: ${JSON.stringify(children)},`)
    }
    lines.push(`    },`)
  }
  lines.push('  },')
  lines.push('})')
  return lines.join('\n')
}
