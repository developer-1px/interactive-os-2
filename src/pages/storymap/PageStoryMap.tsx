import { useMemo } from 'react'
import { parseStoryMap } from './storyMapSchema'
import type { Need, Story, Feature } from './storyMapSchema'
import css from './PageStoryMap.module.css'

import storiesRaw from '../../../docs/2-areas/apps/cms/stories.yaml?raw'

function StoryCard({ story }: { story: Story }) {
  return (
    <div className={css.smStory} data-status={story.status}>
      <div className={css.smStory__header}>
        <span className={css.smStory__id}>{story.id}</span>
        {story.status === 'blocked' && (
          <span className={css.smStory__blocked} />
        )}
      </div>
      <div className={css.smStory__text}>{story.story}</div>
      {story.links.length > 0 && (
        <div className={css.smLinks}>
          {story.links.map(link => (
            <a
              key={link.url}
              href={link.url}
              className={css.smLinks__item}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className={css.smFeature}>
      <span className={css.smFeature__id}>{feature.id}</span>
      <div className={css.smFeature__text}>{feature.feature}</div>
      {feature.screens.length > 0 && (
        <div className={css.smFeature__screens}>
          {feature.screens.map(s => (
            <span key={s} className={css.smFeature__screenTag}>{s}</span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Compute column start index for each need */
function useColumnLayout(needs: Need[]) {
  return useMemo(() => {
    const layout: { need: Need; colStart: number; span: number }[] = []
    let col = 1
    for (const need of needs) {
      const span = need.stories.length
      layout.push({ need, colStart: col, span })
      col += span
    }
    return { layout, totalColumns: col - 1 }
  }, [needs])
}

export default function PageStoryMap() {
  const data = useMemo(() => parseStoryMap(storiesRaw), [])
  const { layout, totalColumns } = useColumnLayout(data.needs)

  return (
    <div className={css.sm}>
      <div className={css.smHeader}>
        <span className={css.smHeader__title}>USER STORY MAP</span>
        <div className={css.smLegend}>
          <div className={css.smLegend__item}>pending</div>
          <div className={css.smLegend__item}>
            <span className={css.smLegend__bar} />
            active
          </div>
          <div className={css.smLegend__item}>
            <span className={css.smLegend__done} />
            done
          </div>
          <div className={css.smLegend__item}>
            <span className={css.smStory__blocked} />
            blocked
          </div>
        </div>
      </div>
      <div className={css.smBody}>
        <div
          className={css.smMap}
          style={{ gridTemplateColumns: `repeat(${totalColumns}, 220px)` }}
        >
          {/* Row 1: Need headers spanning their story columns */}
          {layout.map(({ need, colStart, span }) => {
            const persona = need.persona === 'admin' ? '관' : '디'
            return (
              <div
                key={need.id}
                className={css.smNeedHeader}
                style={{ gridColumn: `${colStart} / span ${span}` }}
              >
                <div className={css.smNeedHeader__top}>
                  <span className={css.smPersonaBadge}>{persona}</span>
                  {need.id} · {need.persona}
                </div>
                {need.need}
              </div>
            )
          })}

          {/* Row 2+: Story columns with features */}
          {layout.flatMap(({ need, colStart }) =>
            need.stories.map((story, i) => (
              <div
                key={story.id}
                className={css.smStoryCol}
                data-status={story.status}
                style={{ gridColumn: colStart + i }}
              >
                <StoryCard story={story} />
                {story.features.map(f => (
                  <FeatureCard key={f.id} feature={f} />
                ))}
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  )
}
