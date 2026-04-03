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
    // file:line:col:text or file:line:text or file:text
    const m = raw.match(/^(.+?):(\d+):(.*)$/)
    if (m) {
      const file = m[1]
      const entry: MatchLine = { file, line: parseInt(m[2], 10), text: m[3] }
      const arr = groups.get(file) ?? []
      arr.push(entry)
      groups.set(file, arr)
    } else {
      // file path only (files_with_matches mode)
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
    <div className={`${ax({ layout: 'column', textStyle: 'code' })} ${styles.root}`}>
      <div className={ax({ padding: 'xs', textStyle: 'caption', text: 'muted', flex: 'none' })}>
        {[...groups.values()].reduce((s, g) => s + Math.max(g.length, 1), 0)} matches in {groups.size} files — "{query}"
      </div>
      {[...groups.entries()].map(([file, matches]) => (
        <div key={file} className={styles.fileGroup}>
          <div className={styles.fileHeader}>{file.replace(/.*\/aria\//, '')}</div>
          {matches.map((m, i) => (
            <div key={i} className={styles.matchLine}>
              {m.line != null && <span className={styles.lineNo}>{m.line}</span>}
              <span className={styles.matchText}>{m.text}</span>
            </div>
          ))}
          {matches.length === 0 && (
            <div className={styles.matchLine}>
              <span className={styles.matchText}>(file match)</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
