/** @catalog 사용자 프로필 이미지/이니셜 표시 */
import { ax } from '@styles/ax'
import styles from './Avatar.module.css'

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

const sizeClass: Record<AvatarSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const initials = getInitials(name)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${ax({ role: 'cell', surface: 'display' })} ${sizeClass[size]}`}
      />
    )
  }

  return (
    <div
      className={`${ax({
        role: 'cell',
        surface: 'display',
        layout: 'center',
        textStyle: size === 'lg' ? 'label' : 'caption',
      })} ${sizeClass[size]}`}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  )
}
