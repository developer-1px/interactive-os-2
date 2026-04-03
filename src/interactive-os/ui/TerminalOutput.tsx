import { ax } from '@styles/ax'
import styles from './TerminalOutput.module.css'

export interface TerminalOutputProps {
  command: string
  output: string
}

export function TerminalOutput({ command, output }: TerminalOutputProps) {
  return (
    <div className={`${ax({ layout: 'column', textStyle: 'code', flex: '1' })} ${styles.root}`}>
      <div className={styles.prompt}>
        <span className={styles.promptSymbol}>$</span>
        <span className={styles.command}>{command}</span>
      </div>
      <div className={styles.output}>{output || '(no output)'}</div>
    </div>
  )
}
