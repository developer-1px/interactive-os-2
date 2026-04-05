// ② pages/book 소급 마이그레이션 — TocItem을 bake-in한 NavList
import type { NormalizedData } from '../store/types'
import { NavList } from './NavList'
import { TocItem } from './items'

interface TocNavListProps {
  data: NormalizedData
  onActivate?: (nodeId: string) => void
  'aria-label'?: string
}

export function TocNavList({ data, onActivate, 'aria-label': ariaLabel }: TocNavListProps) {
  return (
    <NavList
      data={data}
      onActivate={onActivate}
      renderItem={TocItem}
      aria-label={ariaLabel}
    />
  )
}
