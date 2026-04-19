// ② replayV2BeatPrd
import type { CSSProperties, JSX, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { ax } from '@styles/ax'
import type {
  Beat,
  ThinkingBeat,
  TerminalBeat,
  DiffBeat,
  ReadBeat,
  CommitBeat,
  FiletreeBeat,
  PreviewBeat,
} from './beatTypes'
import './beatStages.css'

export interface BeatRendererProps {
  beat: Beat
  /** 0..1 — useBeatPlayer가 주입. 콘텐츠 reveal 비율 계산 기준 */
  progress: number
  /** CSS var --agent-hue로 카드별 색조 */
  hue: number
}

export function BeatRenderer({ beat, progress, hue }: BeatRendererProps): JSX.Element | null {
  const cssVar = { '--agent-hue': String(hue) } as CSSProperties
  switch (beat.kind) {
    case 'thinking': return <ThinkingBeatView beat={beat} progress={progress} cssVar={cssVar} />
    case 'terminal': return <TerminalBeatView beat={beat} progress={progress} />
    case 'diff':     return <DiffBeatView beat={beat} progress={progress} />
    case 'read':     return <ReadBeatView beat={beat} progress={progress} />
    case 'commit':   return <CommitBeatView beat={beat} progress={progress} />
    case 'filetree': return <FiletreeBeatView beat={beat} progress={progress} />
    case 'preview':  return <PreviewBeatView beat={beat} progress={progress} />
    default: return null
  }
}

// ─────────────────────────────────────────────
// Thinking
// ─────────────────────────────────────────────

function ThinkingBeatView({ beat, progress, cssVar }: {
  beat: ThinkingBeat
  progress: number
  cssVar: CSSProperties
}) {
  const text = beat.text
  const cut = Math.min(text.length, Math.floor(text.length * Math.min(1, progress * 1.1)))
  const shown = text.slice(0, cut)

  return (
    <div
      className={`beat-frame beat-thinking ${ax({ layout: 'stack', width: 'full' })}`}
      style={cssVar}
    >
      <div className={`beat-label ${ax({ textStyle: 'caption' })}`}>THINKING</div>
      <div className={ax({ layout: 'row' })}>
        <div className={`beat-thinking__avatar ${ax({ layout: 'center', textStyle: 'caption' })}`}>
          ◆
        </div>
        <div className={`beat-thinking__name ${ax({ textStyle: 'caption' })}`}>agent</div>
        <span className={`beat-thinking__dot beat-thinking__dot--0`} />
        <span className={`beat-thinking__dot beat-thinking__dot--1`} />
        <span className={`beat-thinking__dot beat-thinking__dot--2`} />
      </div>
      <div className={`beat-thinking__text ${ax({ textStyle: 'page' })}`}>
        {shown}
        <span className="beat-thinking__caret" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Terminal
// ─────────────────────────────────────────────

function TerminalBeatView({ beat, progress }: { beat: TerminalBeat; progress: number }) {
  const lines = beat.lines.length === 0
    ? [{ t: 'cmd' as const, v: beat.command }]
    : [{ t: 'cmd' as const, v: beat.command }, ...beat.lines]
  const totalChars = lines.reduce((n, l) => n + l.v.length + 1, 0)
  const reveal = Math.floor(totalChars * Math.min(1, progress * 1.05))

  let remaining = reveal
  const rendered: Array<{ t: 'cmd' | 'out' | 'ok' | 'err'; v: string; done: boolean }> = []
  for (const line of lines) {
    if (remaining <= 0) break
    const take = Math.min(line.v.length, remaining)
    rendered.push({ ...line, v: line.v.slice(0, take), done: take >= line.v.length })
    remaining -= take + 1
  }

  return (
    <div className={`beat-frame beat-terminal ${ax({ layout: 'stack', width: 'full' })}`}>
      <div className={`beat-terminal__chrome ${ax({ layout: 'row' })}`}>
        <div className={ax({ layout: 'row' })}>
          <div className="beat-terminal__dot beat-terminal__dot--red" />
          <div className="beat-terminal__dot beat-terminal__dot--yellow" />
          <div className="beat-terminal__dot beat-terminal__dot--green" />
        </div>
        <div className={`beat-terminal__title ${ax({ flex: '1', textStyle: 'caption' })}`}>terminal</div>
      </div>
      <div className={`beat-terminal__body ${ax({ flex: '1', layout: 'clip', textStyle: 'code' })}`}>
        {rendered.map((l, i) => (
          <div key={i} className={`beat-terminal__line beat-terminal__line--${l.t}`}>
            {l.t === 'cmd' && <span className="beat-terminal__prompt">{'>'}</span>}
            {l.v}
            {i === rendered.length - 1 && !l.done && <span className="beat-terminal__caret" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Diff
// ─────────────────────────────────────────────

function DiffBeatView({ beat, progress }: { beat: DiffBeat; progress: number }) {
  const total = beat.lines.length
  const shownCount = Math.floor(total * Math.min(1, progress * 1.1))
  const sym: Record<'add' | 'del' | 'ctx', string> = { add: '+', del: '-', ctx: ' ' }

  return (
    <div className={`beat-frame beat-diff ${ax({ layout: 'stack', width: 'full' })}`}>
      <div className="beat-diff__header">
        <div className={`beat-label ${ax({ textStyle: 'caption' })}`}>DIFF</div>
        <div className={`beat-diff__file ${ax({ layout: 'row', textStyle: 'code' })}`}>
          {beat.file}
        </div>
      </div>
      <div className={ax({ flex: '1', layout: 'stack', textStyle: 'code' })}>
        {beat.lines.slice(0, shownCount).map((l, i) => (
          <div key={i} className={`beat-diff__line beat-diff__line--${l.t} ${ax({ layout: 'row' })}`}>
            <span className={`beat-diff__sym beat-diff__sym--${l.t}`}>{sym[l.t]}</span>
            <span className="beat-diff__text">{l.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Read — 파일 보기 (file 이름 hero + 라인 점진 reveal)
// ─────────────────────────────────────────────

function ReadBeatView({ beat, progress }: { beat: ReadBeat; progress: number }) {
  const total = beat.lines.length
  const shown = Math.floor(total * Math.min(1, progress * 1.2))
  return (
    <div className={`beat-frame beat-diff ${ax({ layout: 'stack', width: 'full' })}`}>
      <div className="beat-diff__header">
        <div className={`beat-label ${ax({ textStyle: 'caption' })}`}>READ</div>
        <div className={`beat-diff__file ${ax({ layout: 'row', textStyle: 'code' })}`}>{beat.file}</div>
      </div>
      <div className={ax({ flex: '1', layout: 'stack', textStyle: 'code' })}>
        {beat.lines.slice(0, shown).map((l, i) => (
          <div key={i} className={`beat-diff__line beat-diff__line--ctx ${ax({ layout: 'row' })}`}>
            <span className="beat-diff__sym beat-diff__sym--ctx"> </span>
            <span className="beat-diff__text">{l || '\u00A0'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Commit
// ─────────────────────────────────────────────

function CommitBeatView({ beat, progress }: { beat: CommitBeat; progress: number }) {
  const total = beat.additions + beat.deletions
  const addRatio = total > 0 ? beat.additions / total : 0.5
  return (
    <div className={`beat-frame beat-commit ${ax({ layout: 'stack', width: 'full' })}`}>
      <div className={`beat-label ${ax({ textStyle: 'caption' })}`}>COMMIT</div>
      <div className={`beat-commit__meta ${ax({ textStyle: 'caption' })}`}>
        {beat.branch} · {beat.hash}
      </div>
      <div className={`beat-commit__message ${ax({ textStyle: 'page' })}`}>
        {beat.message}
      </div>
      {beat.body && (
        <div className={`beat-commit__body ${ax({ textStyle: 'body' })}`}>
          {beat.body}
        </div>
      )}
      <div className={`beat-commit__stats ${ax({ layout: 'row', textStyle: 'caption' })}`}>
        <Stat valueClass="beat-commit__stat-value--files" value={beat.files} label="files" />
        <Stat valueClass="beat-commit__stat-value--add"   value={beat.additions} label="+" />
        <Stat valueClass="beat-commit__stat-value--del"   value={beat.deletions} label="-" />
      </div>
      <div className={`beat-commit__bar ${ax({ layout: 'row' })}`}>
        {Array.from({ length: 20 }).map((_, i) => {
          const isAdd = i / 20 < addRatio
          const cls = isAdd ? 'beat-commit__bar-cell--add' : 'beat-commit__bar-cell--del'
          const opacity = progress > i / 20 ? '1' : '0.15'
          return (
            <div
              key={i}
              className={`beat-commit__bar-cell ${cls} ${ax({ flex: '1' })}`}
              style={{ '--cell-opacity': opacity } as CSSProperties}
            />
          )
        })}
      </div>
    </div>
  )
}

function Stat({ valueClass, value, label }: { valueClass: string; value: number; label: string }) {
  return (
    <div className={`beat-commit__stat ${ax({ layout: 'row' })}`}>
      <span className={`beat-commit__stat-value ${valueClass}`}>{value}</span>
      <span className="beat-commit__stat-label">{label}</span>
    </div>
  )
}

// ─────────────────────────────────────────────
// Filetree
// ─────────────────────────────────────────────

type FiletreePhase = 'before' | 'trans' | 'after'
type FiletreeEntry = FiletreeBeat['before'][number]

function pickFiletreePhase(progress: number): FiletreePhase {
  if (progress < 0.45) return 'before'
  if (progress < 0.55) return 'trans'
  return 'after'
}

function FiletreeBeatView({ beat, progress }: { beat: FiletreeBeat; progress: number }) {
  const phase = pickFiletreePhase(progress)
  const list = phase === 'before' ? beat.before : beat.after

  return (
    <div className={`beat-frame beat-filetree ${ax({ layout: 'stack', width: 'full' })}`}>
      <div className={`beat-label ${ax({ textStyle: 'caption' })}`}>
        FILE TREE · {phase === 'before' ? 'BEFORE' : 'AFTER'}
      </div>
      <div className={`beat-filetree__list ${phase === 'trans' ? 'beat-filetree__list--trans' : ''}`}>
        {list.map((f, i) => (
          <FiletreeRow key={i} entry={f} index={i} phase={phase} />
        ))}
      </div>
    </div>
  )
}

function FiletreeRow({ entry, index, phase }: { entry: FiletreeEntry; index: number; phase: FiletreePhase }) {
  const isAdd = entry.hl === 'add'
  const isDel = entry.hl === 'del'
  const rowMod = isAdd ? 'beat-filetree__row--add' : isDel ? 'beat-filetree__row--del' : ''
  const symMod = isAdd ? 'beat-filetree__sym--add' : isDel ? 'beat-filetree__sym--del' : ''
  const delay = phase === 'after' && isAdd ? `${index * 0.07}s` : undefined
  const styleVar = delay ? ({ '--row-delay': delay } as CSSProperties) : undefined

  return (
    <div className={`beat-filetree__row ${rowMod} ${ax({ layout: 'row' })}`} style={styleVar}>
      <span className={`beat-filetree__sym ${symMod}`}>{renderFiletreeGlyph(entry, isAdd, isDel)}</span>
      <span>{entry.name}</span>
    </div>
  )
}

function renderFiletreeGlyph(entry: FiletreeEntry, isAdd: boolean, isDel: boolean): ReactNode {
  if (isAdd) return '+'
  if (isDel) return '-'
  if (entry.type === 'dir') return <ChevronRight aria-hidden size={12} />
  return '·'
}

// ─────────────────────────────────────────────
// Preview
// ─────────────────────────────────────────────

function PreviewBeatView({ beat, progress }: { beat: PreviewBeat; progress: number }) {
  const lit = progress > 0.3
  return (
    <div className={`beat-frame beat-preview ${ax({ layout: 'stack', width: 'full' })}`}>
      <div className={`beat-label ${ax({ textStyle: 'caption' })}`}>DEPLOY · PREVIEW</div>

      <div className={`beat-preview__urlbar ${ax({ layout: 'row' })}`}>
        <div className={`beat-preview__dot ${lit ? 'beat-preview__dot--lit' : ''}`} />
        <span className={`beat-preview__url ${ax({ flex: '1', clamp: '1' })}`}>
          https://{beat.url}
        </span>
      </div>

      <div
        className={`beat-preview__page ${lit ? 'beat-preview__page--lit' : ''} ${ax({ flex: '1', layout: 'stack' })}`}
      >
        <div className={`beat-preview__nav ${ax({ layout: 'spread' })}`}>
          <div className={`beat-preview__brand ${ax({ textStyle: 'body' })}`}>acme</div>
          <div className={`beat-preview__nav-links ${ax({ layout: 'row', textStyle: 'caption' })}`}>
            <span>Product</span><span>Pricing</span><span>Docs</span>
          </div>
        </div>

        <div className={`beat-preview__eyebrow ${ax({ textStyle: 'caption' })}`}>
          {beat.eyebrow}
        </div>

        <div className={`beat-preview__title ${ax({ textStyle: 'hero' })}`}>
          {beat.title}
        </div>

        <div className={`beat-preview__sub ${ax({ textStyle: 'caption' })}`}>
          {beat.sub}
        </div>

        <div className={ax({ layout: 'row' })}>
          <div className={`beat-preview__cta-primary ${ax({ textStyle: 'caption' })}`}>
            Start free
          </div>
          <div className={`beat-preview__cta-secondary ${ax({ textStyle: 'caption' })}`}>
            Book a demo
          </div>
        </div>

        <div className={`beat-preview__shot ${ax({ flex: '1', layout: 'center', textStyle: 'caption' })}`}>
          product shot
        </div>
      </div>
    </div>
  )
}
