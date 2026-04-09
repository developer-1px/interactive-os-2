import { useState, useCallback, useRef, useEffect } from 'react' // @useState-hatch — devtools 전용 로컬 UI 상태
import { CircleCheck, CircleX, Circle, Play } from 'lucide-react'
import { ax } from '@styles/ax'
import { runTest, demoTest, type RunTestResult, type TestResult } from './runTest'
import css from './TestRunnerPanel.module.css'

function StatusIcon({ status }: { status: 'pass' | 'fail' | 'pending' }) {
  if (status === 'pass') return <span className={ax({ tone: 'success' })}><CircleCheck size={14} /></span>
  if (status === 'fail') return <span className={ax({ tone: 'danger' })}><CircleX size={14} /></span>
  return <span className={ax({ text: 'muted' })}><Circle size={14} /></span>
}

function ResultItem({ result }: { result: TestResult }) {
  const [expanded, setExpanded] = useState(false) // @useState-hatch

  return (
    <div className={`${ax({ padding: 'md' })} ${css.resultItem}`}>
      <div
        className={ax({ layout: 'bar', gap: 'sm' })}
        onClick={() => result.error && setExpanded(!expanded)}
      >
        <StatusIcon status={result.status} />
        <span>{result.name}</span>
        <span className={ax({ text: 'muted', textStyle: 'caption' })}>{result.duration.toFixed(0)}ms</span>
      </div>
      {expanded && result.error && (
        <pre className={`${ax({ tone: 'danger', textStyle: 'caption', clamp: 'pre' })} ${css.errorPre}`}>
          {result.error}
        </pre>
      )}
    </div>
  )
}

function GroupResults({ groupName, results }: { groupName: string; results: TestResult[] }) {
  const allPass = results.every((r) => r.status === 'pass')
  return (
    <div className={css.groupBlock}>
      <div className={ax({ layout: 'bar', gap: 'sm', weight: 'semi' })}>
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
  const [state, setState] = useState<'idle' | 'running' | 'demo' | 'done'>('idle') // @useState-hatch
  const [result, setResult] = useState<RunTestResult | null>(null) // @useState-hatch
  const renderAreaRef = useRef<HTMLDivElement>(null)
  const hiddenAreaRef = useRef<HTMLDivElement>(null)

  const runningRef = useRef(false)

  const getTarget = useCallback(() => {
    return headless
      ? (hiddenAreaRef.current ?? undefined)
      : (renderAreaRef.current ?? undefined)
  }, [headless])

  const demo = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    setState('running')
    try {
      const r = await demoTest(testPath, getTarget())
      setResult(r)
    } catch (e) {
      setResult({
        groups: [],
        results: [{ group: [], name: 'Import Error', status: 'fail', error: e instanceof Error ? e.message : String(e), duration: 0 }],
      })
    }
    setState('demo')
    runningRef.current = false
  }, [testPath, getTarget])

  const run = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    setState('running')
    setResult(null)
    try {
      const r = await runTest(testPath, getTarget())
      setResult(r)
    } catch (e) {
      setResult({
        groups: [],
        results: [{ group: [], name: 'Import Error', status: 'fail', error: e instanceof Error ? e.message : String(e), duration: 0 }],
      })
    }
    setState('done')
    runningRef.current = false
  }, [testPath, getTarget])

  useEffect(() => {
    if (autoRun) demo()
  }, [autoRun, demo])

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

  const ready = state === 'demo' || state === 'done'

  return (
    <div>
      {headless
        ? <div ref={hiddenAreaRef} className={css.hidden} />
        : <div className={`card ${ax({ scroll: 'hidden', padding: 'sm' })} ${css.renderArea} ${ready ? '' : css.hidden}`} ref={renderAreaRef} />
      }
      <div className={`card ${ax({ scroll: 'hidden', padding: 'md' })} ${ready ? '' : css.hidden}`}>
        <div className={`${ax({ layout: 'spread' })} ${ready ? css.summaryBar : ''}`}>
          <div className={ax({ layout: 'bar', gap: 'md' })}>
            <span className={ax({ textStyle: 'code', weight: 'bold' })}>
              {label ?? 'Test Runner'}
            </span>
            {state === 'demo' && result && (
              <span className={ax({ text: 'muted', textStyle: 'code' })}>
                {total} tests
              </span>
            )}
            {state === 'done' && result && (
              <span className={ax({ textStyle: 'code' })}>
                <span className={css.passCount}>{passed} passed</span>
                {failed > 0 && <span className={css.failCount}>{failed} failed</span>}
                <span className={`${ax({ text: 'muted' })} ${css.totalCount}`}>{total} total</span>
              </span>
            )}
          </div>
          <button
            className="btn"
            onClick={run}
            disabled={state === 'running'}
          >
            {state === 'running' ? 'Running...' : <><Play size={14} /> Run Test</>}
          </button>
        </div>

        {state === 'done' && result && (
          <div className={`${ax({ textStyle: 'code' })} ${css.resultDetails}`}>
            {Object.entries(grouped).map(([group, results]) => (
              <GroupResults key={group} groupName={group} results={results} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
