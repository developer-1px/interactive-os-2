var e=`/** @catalog 터미널 명령어+출력 표시 */
// ② 2026-04-03-viewer-command-prd.md
import { ax } from '@styles/ax'

export interface TerminalOutputProps {
  command: string
  output: string
}

export function TerminalOutput({ command, output }: TerminalOutputProps) {
  return (
    <div className={ax({ layout: 'stack', textStyle: 'code', flex: '1', surface: 'sunken', text: 'primary' })}>
      <div className={ax({ placement: 'sticky', gap: 'sm', padding: 'sm', surface: 'sunken' })}>
        <span className={ax({ tone: 'success', flex: 'none' })}>$</span>
        <span className={ax({ weight: 'semi' })} style={{ wordBreak: 'break-all' }}>{command}</span>
      </div>
      <div className={ax({ padding: 'sm' })} style={{ wordBreak: 'break-all' }}>{output || '(no output)'}</div>
    </div>
  )
}
`;export{e as default};