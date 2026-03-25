// ② 2026-03-25-stream-feed-prd.md
import { useState, useEffect } from 'react'

type RevealUnit = 'char' | 'line' | 'sentence'

/**
 * @param speed - ms per tick (default 16)
 * @param charsPerTick - characters per tick when unit='char' (default 1)
 * @param unit - reveal granularity: 'char' | 'line' | 'sentence' (default 'char')
 */
export function useTypewriter(
  text: string,
  active: boolean,
  speed = 16,
  charsPerTick = 1,
  unit: RevealUnit = 'char',
) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!active) { setDisplayed(''); setDone(false); return }
    setDisplayed('')
    setDone(false)

    if (unit === 'char') {
      let i = 0
      const interval = setInterval(() => {
        i = Math.min(i + charsPerTick, text.length)
        setDisplayed(text.slice(0, i))
        if (i >= text.length) { clearInterval(interval); setDone(true) }
      }, speed)
      return () => clearInterval(interval)
    }

    // line or sentence mode: split into chunks and reveal one per tick
    const chunks = unit === 'line'
      ? text.split('\n')
      : text.split(/(?<=[.!?。]\s?)/)

    let idx = 0
    const interval = setInterval(() => {
      idx++
      const revealed = unit === 'line'
        ? chunks.slice(0, idx).join('\n')
        : chunks.slice(0, idx).join('')
      setDisplayed(revealed)
      if (idx >= chunks.length) { clearInterval(interval); setDone(true) }
    }, speed)
    return () => clearInterval(interval)
  }, [text, active, speed, charsPerTick, unit])

  return { displayed, done }
}
