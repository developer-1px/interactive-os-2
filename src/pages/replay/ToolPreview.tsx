// ② 2026-04-03-session-replay-phase-b-prd.md
import { memo } from 'react'
import { CodeBlock } from '@os/ui/CodeBlock'
import { DiffBlock } from '@os/ui/chat/DiffBlock'
import { ax } from '@styles/ax'
import type { ToolStep } from './parseJsonl'

function stripCatN(text: string): string {
  return text
    .split('\n')
    .map(line => line.replace(/^\s*\d+\t/, ''))
    .join('\n')
}

function filenameFrom(path: string | null): string {
  if (!path) return 'output'
  const parts = path.split('/')
  return parts[parts.length - 1] || 'output'
}

function truncate(text: string, maxLines: number): { text: string; truncated: boolean } {
  const lines = text.split('\n')
  if (lines.length <= maxLines) return { text, truncated: false }
  return { text: lines.slice(0, maxLines).join('\n'), truncated: true }
}

const MAX_LINES = 200

export const ToolPreview = memo(function ToolPreview({ step }: { step: ToolStep | null }) {
  if (!step) {
    return (
      <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption' })}>
        tool_use 스텝이 재생되면 여기에 표시됩니다
      </div>
    )
  }

  const { tool, input, result } = step

  if (tool === 'Read' && result) {
    const code = stripCatN(result)
    const { text, truncated } = truncate(code, MAX_LINES)
    return (
      <div className={ax({ layout: 'fill' })}>
        <CodeBlock code={text} filename={filenameFrom(step.filePath)} variant="flush" />
        {truncated && <div className={ax({ textStyle: 'caption', text: 'muted', padding: 'sm' })}>… truncated</div>}
      </div>
    )
  }

  if (tool === 'Edit') {
    const old = (input.old_string as string) ?? ''
    const neu = (input.new_string as string) ?? ''
    return (
      <div className={ax({ layout: 'fill' })}>
        <DiffBlock block={{ type: 'diff', old, new: neu, filePath: step.filePath ?? undefined }} />
      </div>
    )
  }

  if (tool === 'Write') {
    const code = (input.content as string) ?? result ?? ''
    const { text, truncated } = truncate(code, MAX_LINES)
    return (
      <div className={ax({ layout: 'fill' })}>
        <CodeBlock code={text} filename={filenameFrom(step.filePath)} variant="flush" />
        {truncated && <div className={ax({ textStyle: 'caption', text: 'muted', padding: 'sm' })}>… truncated</div>}
      </div>
    )
  }

  // Bash: command + output
  if (tool === 'Bash') {
    const command = (input.command as string) ?? ''
    const output = result ?? ''
    const { text, truncated } = truncate(output, MAX_LINES)
    return (
      <div className={ax({ layout: 'fill' })}>
        <pre className={ax({ textStyle: 'code', padding: 'sm', text: 'secondary' })}>
          <div className={ax({ text: 'bright' })}>$ {command}</div>
          {text && <div>{text}</div>}
          {truncated && <div className={ax({ text: 'muted' })}>… truncated</div>}
        </pre>
      </div>
    )
  }

  // Glob/Grep/other: show result as plain text
  return (
    <div className={ax({ layout: 'fill' })}>
      <pre className={ax({ textStyle: 'code', padding: 'sm', text: 'secondary' })}>
        <div className={ax({ text: 'bright' })}>{tool}: {JSON.stringify(input, null, 2).slice(0, 200)}</div>
        {result && <div>{truncate(result, MAX_LINES).text}</div>}
      </pre>
    </div>
  )
})
