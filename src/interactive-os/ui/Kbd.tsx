/** @catalog 키보드 단축키 표시 */
import { ax } from '@styles/ax'

interface KbdProps {
  children: React.ReactNode
}

export function Kbd({ children }: KbdProps) {
  return (
    <kbd
      className={ax({
        role: 'badge',
        surface: 'overlay',
        textStyle: 'code',
        content: 'text'
      })}
    >
      {children}
    </kbd>
  )
}
