import { useState, useCallback } from 'react'
import { runTest, type RunTestResult, type TestResult } from './runTest'

function StatusIcon({ status }: { status: 'pass' | 'fail' | 'pending' }) {
  if (status === 'pass') return <span style={{ color: 'var(--color-green, #22c55e)' }}>●</span>
  if (status === 'fail') return <span style={{ color: 'var(--color-red, #ef4444)' }}>●</span>
  return <span style={{ color: 'var(--color-muted, #888)' }}>○</span>
}

function ResultItem({ result }: { result: TestResult }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ paddingLeft: 16 }}>
      <div
        style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: result.error ? 'pointer' : 'default' }}
        onClick={() => result.error && setExpanded(!expanded)}
      >
        <StatusIcon status={result.status} />
        <span style={{ fontSize: 13 }}>{result.name}</span>
        <span style={{ fontSize: 11, color: 'var(--color-muted, #888)' }}>{result.duration.toFixed(0)}ms</span>
      </div>
      {expanded && result.error && (
        <pre style={{ fontSize: 11, color: 'var(--color-red, #ef4444)', margin: '4px 0 4px 24px', whiteSpace: 'pre-wrap' }}>
          {result.error}
        </pre>
      )}
    </div>
  )
}

function GroupResults({ groupName, results }: { groupName: string; results: TestResult[] }) {
  const allPass = results.every((r) => r.status === 'pass')
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600, fontSize: 13 }}>
        <StatusIcon status={allPass ? 'pass' : 'fail'} />
        <span>{groupName}</span>
      </div>
      {results.map((r, i) => (
        <ResultItem key={i} result={r} />
      ))}
    </div>
  )
}

type Props = {
  testPath: string
  label?: string
}

export function TestRunnerPanel({ testPath, label }: Props) {
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle')
  const [result, setResult] = useState<RunTestResult | null>(null)

  const run = useCallback(async () => {
    setState('running')
    setResult(null)
    try {
      const r = await runTest(testPath)
      setResult(r)
    } catch (e) {
      setResult({
        groups: [],
        results: [{ group: [], name: 'Import Error', status: 'fail', error: e instanceof Error ? e.message : String(e), duration: 0 }],
      })
    }
    setState('done')
  }, [testPath])

  const passed = result?.results.filter((r) => r.status === 'pass').length ?? 0
  const failed = result?.results.filter((r) => r.status === 'fail').length ?? 0
  const total = result?.results.length ?? 0

  // Group results by their first group path segment
  const grouped = result
    ? result.results.reduce<Record<string, TestResult[]>>((acc, r) => {
        const key = r.group.join(' > ') || 'root'
        ;(acc[key] ??= []).push(r)
        return acc
      }, {})
    : {}

  return (
    <div
      style={{
        border: '1px solid var(--color-border, #333)',
        borderRadius: 8,
        padding: 16,
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          {label ?? 'Test Runner'}
        </span>
        <button
          onClick={run}
          disabled={state === 'running'}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: '1px solid var(--color-border, #555)',
            background: state === 'running' ? 'var(--color-muted, #333)' : 'var(--color-surface, #1a1a1a)',
            color: 'var(--color-text, #eee)',
            cursor: state === 'running' ? 'wait' : 'pointer',
            fontSize: 13,
          }}
        >
          {state === 'running' ? 'Running...' : '▶ Run Test'}
        </button>
      </div>

      {state === 'done' && result && (
        <>
          <div style={{ fontSize: 13, marginBottom: 12, display: 'flex', gap: 16 }}>
            <span style={{ color: 'var(--color-green, #22c55e)' }}>{passed} passed</span>
            {failed > 0 && <span style={{ color: 'var(--color-red, #ef4444)' }}>{failed} failed</span>}
            <span style={{ color: 'var(--color-muted, #888)' }}>{total} total</span>
          </div>
          {Object.entries(grouped).map(([group, results]) => (
            <GroupResults key={group} groupName={group} results={results} />
          ))}
        </>
      )}
    </div>
  )
}
