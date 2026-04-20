// studioExamples — studio ExampleSidebar가 소비하는 통합 카탈로그.
// A2UI envelope 프리셋을 StudioExample로 감싼다. 장래 layout snapshot 프리셋을 추가할 때도 여기에 편입.
import type { NormalizedData } from '@os/store/types'
import { categories, type A2UIv09Envelope } from './studioA2UIPresets'

export type StudioExampleKind = 'layout' | 'a2ui-stream'

export interface StudioExample {
  id: string
  kind: StudioExampleKind
  label: string
  category: string
  /** layout: 즉시 적용 스냅샷. a2ui-stream: envelope (스트리밍 변환). */
  data: NormalizedData | A2UIv09Envelope
}

const a2uiExamples: StudioExample[] = categories.flatMap(cat =>
  Object.entries(cat.presets).map(([name, envelope]) => ({
    id: `a2ui-${cat.label}-${name}`,
    kind: 'a2ui-stream' as const,
    label: name,
    category: `A2UI · ${cat.label}`,
    data: envelope,
  })),
)

export const STUDIO_EXAMPLES: StudioExample[] = [...a2uiExamples]

/** category 별 그룹핑. ExampleSidebar에서 섹션 렌더에 소비. */
export function groupExamples(xs: StudioExample[]): Record<string, StudioExample[]> {
  const out: Record<string, StudioExample[]> = {}
  for (const x of xs) (out[x.category] ??= []).push(x)
  return out
}
