/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useRef, useEffect } from 'react'
import { FilePlayer } from './FilePlayer'
import type { FilePlayerHandle } from './workspaceTypes'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'file-viewer',
  category: 'ui',
  label: 'FilePlayer',
}

const sampleCode = `function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

console.log(fibonacci(10))`

export function Demo() {
  const ref = useRef<FilePlayerHandle>(null)

  useEffect(() => {
    ref.current?.dispatch({ type: 'open', content: sampleCode })
  }, [])

  return (
    <div className={ax({ layout: 'stack' })}>
      <FilePlayer ref={ref} filename="fibonacci.ts" />
    </div>
  )
}
