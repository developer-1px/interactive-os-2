// ② replayV2BeatPrd
import type { CSSProperties, JSX } from 'react'
import { ax } from '@styles/ax'
import { BeatRenderer } from './BeatRenderer'
import { useBeatPlayer } from './useBeatPlayer'
import type { BeatSession } from './beatTypes'
import './beatStages.css'

export interface ShortCardProps {
  session: BeatSession
  /** true = 자동재생, false = 일시정지 */
  active: boolean
  autoplay: boolean
  /** 마지막 beat 종료 후 호출 (다음 세션 이동용) */
  onComplete?: () => void
}

/**
 * @invariant 카드 클릭 = paused 토글
 * @invariant 상단 segment progress: beat 개수만큼 트랙, 현재 beat는 progress * 100% fill
 * @invariant active=false 시 페이서 정지, beatIdx 보존
 */
export function ShortCard({ session, active, autoplay, onComplete }: ShortCardProps): JSX.Element | null {
  const { beatIdx, progress, paused, togglePause } = useBeatPlayer({
    beats: session.beats, active, autoplay, onComplete,
  })
  const beat = session.beats[beatIdx]
  if (!beat) return null

  const cardVar = { '--agent-hue': String(session.agent.hue) } as CSSProperties

  return (
    <div
      className={`short-card ${ax({ width: 'full', layout: 'fill' })}`}
      onClick={togglePause}
      style={cardVar}
    >
      <div className={`short-card__beat ${ax({ placement: 'viewport' })}`}>
        <BeatRenderer beat={beat} progress={progress} hue={session.agent.hue} />
      </div>

      <div className={`short-card__progress ${ax({ layout: 'row' })}`}>
        {session.beats.map((_, i) => {
          const fill = i < beatIdx ? '100%' : i === beatIdx ? `${progress * 100}%` : '0%'
          const fillVar = { '--fill': fill } as CSSProperties
          return (
            <div key={i} className={`short-card__progress-track ${ax({ flex: '1' })}`}>
              <div className="short-card__progress-fill" style={fillVar} />
            </div>
          )
        })}
      </div>

      <div className={`short-card__agent ${ax({ layout: 'row' })}`}>
        <div className={`short-card__avatar ${ax({ layout: 'center', textStyle: 'caption' })}`}>
          {session.agent.avatar}
        </div>
        <div>
          <div className={`short-card__agent-name ${ax({ textStyle: 'caption' })}`}>@{session.agent.name}</div>
          <div className={`short-card__agent-repo ${ax({ textStyle: 'caption' })}`}>{session.repo}</div>
        </div>
      </div>

      <div className={`short-card__title ${ax({ textStyle: 'body' })}`}>{session.title}</div>

      {paused && active && <div className={`short-card__pause ${ax({ layout: 'center' })}`} aria-label="paused" />}
    </div>
  )
}
