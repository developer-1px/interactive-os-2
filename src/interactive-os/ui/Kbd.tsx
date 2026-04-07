/** @catalog 키보드 단축키 표시 */
import { ax } from '@styles/ax'

interface KbdProps {
  children: React.ReactNode
}

export function Kbd({ children }: KbdProps) {
  return (
    <kbd
      className={ax({
        surface: 'overlay',
        shape: 'sm',
        textStyle: 'code',
        text: 'secondary',
        padding: 'xs',
        content: 'text',
        border: 'default',
      })}
    >
      {children}
    </kbd>
  )
}
