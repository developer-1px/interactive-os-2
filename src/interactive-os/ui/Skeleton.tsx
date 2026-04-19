/** @catalog 로딩 상태 스켈레톤 플레이스홀더 */
import { ax } from '@styles/ax'
import type { AxWidth } from '@styles/ax'

interface SkeletonProps {
  width?: AxWidth
  height?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'text' | 'circle' | 'rect'
}

export function Skeleton({ width = 'full', height: _height = 'sm', shape = 'rect' }: SkeletonProps) {
  return (
    <div
      className={ax({
          role: 'control-group',
        surface: 'sunken',
        width: shape === 'circle' ? undefined : width
      })}
      aria-hidden="true"
    />
  )
}
