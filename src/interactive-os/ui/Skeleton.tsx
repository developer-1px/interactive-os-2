/** @catalog 로딩 상태 스켈레톤 플레이스홀더 */
import { ax } from '@styles/ax'
import type { Axes } from '@styles/ax'

interface SkeletonProps {
  width?: Axes['width']
  height?: Axes['size']
  shape?: 'text' | 'circle' | 'rect'
}

export function Skeleton({ width = 'full', height = 'sm', shape = 'rect' }: SkeletonProps) {
  const resolvedShape: Axes['shape'] =
    shape === 'circle' ? 'pill' :
    shape === 'text' ? 'sm' :
    'md'

  return (
    <div
      className={ax({
        surface: 'sunken',
        motion: 'shimmer',
        shape: resolvedShape,
        width: shape === 'circle' ? undefined : width,
        size: height,
      })}
      aria-hidden="true"
    />
  )
}
