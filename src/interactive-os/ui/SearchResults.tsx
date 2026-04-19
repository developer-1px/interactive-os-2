/** @catalog 검색 결과 하이라이트 표시 */
// ② 2026-04-03-viewer-command-prd.md
import { useMemo } from 'react'
import { ax } from '@styles/ax'

export interface SearchResultsProps {
  query: string
  output: string
}

export interface MatchLine {
  file: string
  line: number | null
  text: string
}

/** Parse ripgrep-style output: "file:line:text" or "file:text" */
// eslint-disable-next-line react-refresh/only-export-components
export function parseResults(output: string): Map<string, MatchLine[]> {
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
      <div className={ax({ layout: 'center', flex: '1', textStyle: 'caption' })}>
        No results for "{query}"
      </div>
    )
  }

  return (
    <div className={ax({ layout: 'stack', textStyle: 'code' })}>
      <div className={ax({ textStyle: 'caption', flex: 'none' })}>
        {[...groups.values()].reduce((s, g) => s + Math.max(g.length, 1), 0)} matches in {groups.size} files — "{query}"
      </div>
      {[...groups.entries()].map(([file, matches]) => (
        <div key={file}>
          <div className={ax({
              role: 'control-group',
            surface: 'base', placement: 'sticky' })}>{file.replace(/.*\/aria\//, '')}</div>
          {matches.map((m, i) => (
            <div key={i} className={ax({ role: 'item', layout: 'row', surface: 'ghost' })}>
              {m.line != null && <span className={`${ax({ flex: 'none',  })} text-right`}>{m.line}</span>}
              <span className={ax({ flex: '1', clamp: 'pre' })}>{m.text}</span>
            </div>
          ))}
          {matches.length === 0 && (
            <div className={ax({ layout: 'row' })}>
              <span className={ax({ flex: '1', clamp: 'pre' })}>(file match)</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
