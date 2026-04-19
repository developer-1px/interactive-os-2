import { ax } from '@styles/ax'
import type { StoryDoc } from '../storyTypes'
import { getStoryStats } from '../storiesStore'
import { BehaviorTable } from './BehaviorTable'

interface StoryCardProps {
  doc: StoryDoc
}

function ProgressSummary({ done, wip, todo }: { done: number; wip: number; todo: number }) {
  const total = done + wip + todo
  if (total === 0) return null
  return (
    <div className={ax({ layout: 'row' })}>
      <span className={ax({ textStyle: 'caption', tone: 'success' })}>{done} done</span>
      <span className={ax({ textStyle: 'caption', tone: 'warning' })}>{wip} wip</span>
      <span className={ax({ textStyle: 'caption' })}>{todo} todo</span>
    </div>
  )
}

export function StoryCard({ doc }: StoryCardProps) {
  const stats = getStoryStats(doc)
  const storyLabel = doc.number != null ? `[ Story #${doc.number} ] ${doc.title}` : doc.title

  return (
    <div className={ax({ layout: 'stack', surface: 'display' })}>
      {/* Title bar */}
      <div className={ax({
          role: 'control',
        layout: 'spread', tone: 'accent', surface: 'action' })}>
        <span className={ax({ textStyle: 'label' })}>{storyLabel}</span>
        <ProgressSummary {...stats} />
      </div>

      {/* Body */}
      <div className={ax({ layout: 'row-fill' })}>
        {/* Left: Scope + Design image */}
        <div className={ax({ layout: 'stack', width: 'sm' })}>
          <span className={ax({ textStyle: 'label' })}>In Scope</span>

          {doc.scope.design && (
            <img
              src={doc.scope.design}
              alt={`${doc.title} design`}
              className={ax({ width: 'full' })}
            />
          )}

          <p className={ax({ textStyle: 'caption' })}>{doc.scope.description}</p>

          {doc.decisions && doc.decisions.length > 0 && (
            <div className={ax({ layout: 'stack' })}>
              <span className={ax({ textStyle: 'label' })}>Decisions</span>
              {doc.decisions.map((d, i) => (
                <div key={i} className={ax({ layout: 'stack' })}>
                  <span className={ax({ textStyle: 'caption' })}>{d.title}</span>
                  <span className={ax({ textStyle: 'caption' })}>{d.why}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: GWT table */}
        <div className={ax({ flex: '1' })}>
          <BehaviorTable behaviors={doc.behaviors} />
        </div>
      </div>
    </div>
  )
}
