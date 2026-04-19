/** @catalog 로딩 상태 스켈레톤 플레이스홀더 */
import { ax } from '@styles/ax'
import type { AxWidth } from '@styles/ax'

interface SkeletonProps {
  width?: AxWidth
  height?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'text' | 'circle' | 'rect'
}

export function Skeleton({ width = 'full', height: _height = 'sm', shape = 'rect' }: SkeletonProps) {
  // ② ax-p0-roles-prd (W8): role:'placeholder' 승격 — shimmer motion은 rolePreset이 자동 주입
  return (
    <div
      className={ax({
        role: 'placeholder',
        surface: 'sunken',
        width: shape === 'circle' ? undefined : width,
      })}
      aria-hidden="true"
    />
  )
}
