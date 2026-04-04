// ② 2026-04-03-viewer-command-prd.md
import { ax } from '@styles/ax'
import styles from './TerminalOutput.module.css'

export interface TerminalOutputProps {
  command: string
  output: string
}

export function TerminalOutput({ command, output }: TerminalOutputProps) {
  return (
    <div className={ax({ layout: 'column', textStyle: 'code', flex: '1', surface: 'sunken', text: 'primary' })}>
      <div className={`${ax({ layout: 'row', gap: 'sm', padding: 'sm', surface: 'sunken' })} ${styles.prompt}`}>
        <span className={ax({ text: 'success', flex: 'none' })}>$</span>
        <span className={`${ax({ weight: 'semi' })} ${styles.command}`}>{command}</span>
      </div>
      <div className={`${ax({ padding: 'sm' })} ${styles.output}`}>{output || '(no output)'}</div>
    </div>
  )
}
