// ② 2026-04-03-viewer-command-prd.md
import { useMemo } from 'react'
import { ax } from '@styles/ax'
import styles from './SearchResults.module.css'

export interface SearchResultsProps {
  query: string
  output: string
}

interface MatchLine {
  file: string
  line: number | null
  text: string
}

/** Parse ripgrep-style output: "file:line:text" or "file:text" */
function parseResults(output: string): Map<string, MatchLine[]> {
  const groups = new Map<string, MatchLine[]>()
  for (const raw of output.split('\n')) {
    if (!raw.trim()) continue
    const m = raw.match(/^(.+?):(\d+):(.*)$/)
    if (m) {
      const file = m[1]
      const entry: MatchLine = { file, line: parseInt(m[2], 10), text: m[3] }
      const arr = groups.get(file) ?? []
      arr.push(entry)
      groups.set(file, arr)
    } else {
      const file = raw.trim()
      if (!groups.has(file)) groups.set(file, [])
    }
  }
  return groups
}

export function SearchResults({ query, output }: SearchResultsProps) {
  const groups = useMemo(() => parseResults(output), [output])

  if (groups.size === 0) {
    return (
      <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption' })}>
        No results for "{query}"
      </div>
    )
  }

  return (
    <div className={ax({ layout: 'column', textStyle: 'code' })}>
      <div className={ax({ padding: 'xs', textStyle: 'caption', text: 'muted', flex: 'none' })}>
        {[...groups.values()].reduce((s, g) => s + Math.max(g.length, 1), 0)} matches in {groups.size} files — "{query}"
      </div>
      {[...groups.entries()].map(([file, matches]) => (
        <div key={file}>
          <div className={`${ax({ padding: 'xs', weight: 'semi', opacity: 'dim', surface: 'base' })} ${styles.fileHeader}`}>{file.replace(/.*\/aria\//, '')}</div>
          {matches.map((m, i) => (
            <div key={i} className={`${ax({ layout: 'row', gap: 'sm', padding: 'xs' })} ${styles.matchLine}`}>
              {m.line != null && <span className={`${ax({ flex: 'none', opacity: 'dim' })} ${styles.lineNo}`}>{m.line}</span>}
              <span className={ax({ flex: '1', clamp: 'pre' })}>{m.text}</span>
            </div>
          ))}
          {matches.length === 0 && (
            <div className={ax({ layout: 'row', gap: 'sm', padding: 'xs' })}>
              <span className={ax({ flex: '1', clamp: 'pre' })}>(file match)</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
