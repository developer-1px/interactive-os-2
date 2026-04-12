/** @catalog 코드 블록 우상단 클립보드 복사 버튼 */
// @useState-hatch
import { useState, useCallback } from 'react'
import { ax } from '@styles/ax'
import { CopyIndicator } from './indicators'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [text])

  return (
    <button
      type="button"
      className={ax({ placement: 'top-end', surface: 'ghost', interactive: 'button', text: 'muted', shape: 'md', padding: 'xs' })}
      onClick={handleCopy}
      aria-label="Copy to clipboard"
    >
      <CopyIndicator copied={copied} />
    </button>
  )
}
