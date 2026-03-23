import { useState, useCallback, useRef, useEffect } from 'react'
import { runTest, type RunTestResult, type TestResult } from './runTest'

function StatusIcon({ status }: { status: 'pass' | 'fail' | 'pending' }) {
  if (status === 'pass') return <span style={{ color: 'var(--green)' }}>●</span>
  if (status === 'fail') return <span style={{ color: 'var(--red)' }}>●</span>
  return <span style={{ color: 'var(--text-muted)' }}>○</span>
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
        <span>{result.name}</span>
        <span className="text-muted" style={{ fontSize: '0.85em' }}>{result.duration.toFixed(0)}ms</span>
      </div>
      {expanded && result.error && (
        <pre style={{ color: 'var(--red)', margin: '4px 0 4px 24px', whiteSpace: 'pre-wrap', fontSize: '0.85em' }}>
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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
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
  autoRun?: boolean
  headless?: boolean
}

export function TestRunnerPanel({ testPath, label, autoRun = true, headless = false }: Props) {
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle')
  const [result, setResult] = useState<RunTestResult | null>(null)
  const renderAreaRef = useRef<HTMLDivElement>(null)
  const hiddenAreaRef = useRef<HTMLDivElement>(null)

  const runningRef = useRef(false)

  const run = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    setState('running')
    setResult(null)
    try {
      const target = headless
        ? (hiddenAreaRef.current ?? undefined)
        : (renderAreaRef.current ?? undefined)
      const r = await runTest(testPath, target)
      setResult(r)
    } catch (e) {
      setResult({
        groups: [],
        results: [{ group: [], name: 'Import Error', status: 'fail', error: e instanceof Error ? e.message : String(e), duration: 0 }],
      })
    }
    setState('done')
    runningRef.current = false
  }, [testPath])

  useEffect(() => {
    if (autoRun) run()
  }, [autoRun, run])

  const passed = result?.results.filter((r) => r.status === 'pass').length ?? 0
  const failed = result?.results.filter((r) => r.status === 'fail').length ?? 0
  const total = result?.results.length ?? 0

  const grouped = result
    ? result.results.reduce<Record<string, TestResult[]>>((acc, r) => {
        const key = r.group.join(' > ') || 'root'
        ;(acc[key] ??= []).push(r)
        return acc
      }, {})
    : {}

  return (
    <div>
      {headless
        ? <div ref={hiddenAreaRef} style={{ display: 'none' }} />
        : <div className="card" ref={renderAreaRef} style={{ minHeight: 60, padding: 12, marginBottom: 16 }} />
      }
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: state === 'done' ? 12 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>
              {label ?? 'Test Runner'}
            </span>
            {state === 'done' && result && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.85em' }}>
                <span style={{ color: 'var(--green)' }}>{passed} passed</span>
                {failed > 0 && <span style={{ color: 'var(--red)', marginLeft: 12 }}>{failed} failed</span>}
                <span className="text-muted" style={{ marginLeft: 12 }}>{total} total</span>
              </span>
            )}
          </div>
          <button
            className="btn"
            onClick={run}
            disabled={state === 'running'}
          >
            {state === 'running' ? 'Running...' : '▶ Run Test'}
          </button>
        </div>

        {state === 'done' && result && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.9em' }}>
            {Object.entries(grouped).map(([group, results]) => (
              <GroupResults key={group} groupName={group} results={results} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
