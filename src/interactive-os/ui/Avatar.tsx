/** @catalog 사용자 프로필 이미지/이니셜 표시 */
import { ax } from '@styles/ax'
import type { Axes } from '@styles/ax'

type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarProps {
  src?: string
  name: string
  size?: AvatarSize
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

const sizeMap: Record<AvatarSize, Axes['square']> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const initials = getInitials(name)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={ax({ surface: 'display' })}
      />
    )
  }

  return (
    <div
      className={ax({
          role: 'control-group',
        surface: 'sunken',
        layout: 'center',
        textStyle: size === 'lg' ? 'label' : 'caption'})}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  )
}
