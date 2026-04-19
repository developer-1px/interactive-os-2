/** @catalog 사용자 프로필 이미지/이니셜 표시 */
import { ax } from '@styles/ax'
import type { CsScale } from '@styles/ax'

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

const csMap: Record<AvatarSize, CsScale> = {
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
        className={ax({ role: 'cell', surface: 'display', cs: csMap[size] })}
      />
    )
  }

  return (
    <div
      className={ax({
        role: 'cell',
        surface: 'display',
        layout: 'center',
        cs: csMap[size],
        textStyle: size === 'lg' ? 'label' : 'caption'})}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  )
}
