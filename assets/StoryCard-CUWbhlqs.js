var e=`import { ax } from '@styles/ax'
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
    <div className={ax({ layout: 'row', gap: 'sm' })}>
      <span className={ax({ textStyle: 'caption', tone: 'success' })}>{done} done</span>
      <span className={ax({ textStyle: 'caption', tone: 'warning' })}>{wip} wip</span>
      <span className={ax({ textStyle: 'caption', text: 'muted' })}>{todo} todo</span>
    </div>
  )
}

export function StoryCard({ doc }: StoryCardProps) {
  const stats = getStoryStats(doc)
  const storyLabel = doc.number != null ? \`[ Story #\${doc.number} ] \${doc.title}\` : doc.title

  return (
    <div className={ax({ layout: 'stack', surface: 'display', shape: 'lg', scroll: 'hidden' })}>
      {/* Title bar */}
      <div className={ax({ layout: 'spread', padding: 'md', tone: 'accent', surface: 'action' })}>
        <span className={ax({ textStyle: 'label', weight: 'bold' })}>{storyLabel}</span>
        <ProgressSummary {...stats} />
      </div>

      {/* Body */}
      <div className={ax({ layout: 'row-fill', gap: 'lg', padding: 'lg' })}>
        {/* Left: Scope + Design image */}
        <div className={ax({ layout: 'stack', gap: 'md', width: 'sm' })}>
          <span className={ax({ textStyle: 'label', weight: 'semi', text: 'secondary' })}>In Scope</span>

          {doc.scope.design && (
            <img
              src={doc.scope.design}
              alt={\`\${doc.title} design\`}
              className={ax({ shape: 'md', width: 'full' })}
            />
          )}

          <p className={ax({ textStyle: 'caption', text: 'secondary' })}>{doc.scope.description}</p>

          {doc.decisions && doc.decisions.length > 0 && (
            <div className={ax({ layout: 'stack', gap: 'sm', border: 'top', padding: 'sm' })}>
              <span className={ax({ textStyle: 'label', weight: 'semi', text: 'secondary' })}>Decisions</span>
              {doc.decisions.map((d, i) => (
                <div key={i} className={ax({ layout: 'stack', gap: 'xs' })}>
                  <span className={ax({ textStyle: 'caption', weight: 'medium' })}>{d.title}</span>
                  <span className={ax({ textStyle: 'caption', text: 'muted' })}>{d.why}</span>
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
`;export{e as default};