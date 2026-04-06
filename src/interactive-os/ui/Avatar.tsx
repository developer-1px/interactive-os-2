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

const sizeMap: Record<AvatarSize, Axes['size']> = {
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
        className={ax({ size: sizeMap[size], shape: 'pill', surface: 'display' })}
      />
    )
  }

  return (
    <div
      className={ax({
        size: sizeMap[size],
        shape: 'pill',
        surface: 'action',
        tone: 'accent-dim',
        layout: 'center',
        textStyle: size === 'lg' ? 'label' : 'caption',
        text: 'bright',
        weight: 'semi',
      })}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  )
}
