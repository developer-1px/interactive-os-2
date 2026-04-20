// LayoutBase.scroll 필드를 ax layout 값으로 변환.
// 'y' → 'scroll' (column flex + overflow-y:auto)
// 'x' → 'scroll-x' (row flex + overflow-x:auto)
// 미지정 → fallback (노드 타입별 기본 layout 유지)

type ScrollField = 'y' | 'x' | undefined
type AxLayoutCore = 'row' | 'center' | 'bar' | 'spread' | 'stack' | 'scroll' | 'scroll-x' | 'clip' | 'fill' | 'row-fill' | 'wrap' | 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-7' | 'table'

export function resolveScrollLayout<T extends AxLayoutCore>(scroll: ScrollField, fallback: T): T | 'scroll' | 'scroll-x' {
  if (scroll === 'y') return 'scroll'
  if (scroll === 'x') return 'scroll-x'
  return fallback
}
