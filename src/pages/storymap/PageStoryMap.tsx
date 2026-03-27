import { useMemo } from 'react'
import { parseStoryMap } from './storyMapSchema'
import type { Need, Story, Feature } from './storyMapSchema'
import css from './PageStoryMap.module.css'

import storiesRaw from '../../../docs/2-areas/apps/cms/stories.yaml?raw'

function StoryCard({ story }: { story: Story }) {
  return (
    <div className={css['sm-story']}>
      <div className={css['sm-story__header']}>
        <span className={css['sm-story__id']}>{story.id}</span>
        <span
          className={`${css['sm-story__status']} ${css[`sm-story__status--${story.status}`]}`}
        />
      </div>
      <div className={css['sm-story__text']}>{story.story}</div>
      {story.links.length > 0 && (
        <div className={css['sm-links']}>
          {story.links.map(link => (
            <a
              key={link.url}
              href={link.url}
              className={css['sm-links__item']}
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
    <div className={css['sm-feature']}>
      <span className={css['sm-feature__id']}>{feature.id}</span>
      {feature.feature}
      {feature.screens.length > 0 && (
        <div className={css['sm-feature__screens']}>
          {feature.screens.map(s => (
            <span key={s} className={css['sm-feature__screen-tag']}>{s}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function NeedColumn({ need, releaseStories }: { need: Need; releaseStories: Set<string> }) {
  const persona = need.persona === 'admin' ? '관' : '디'

  const inRelease = need.stories.filter(s => releaseStories.has(s.id))
  const rest = need.stories.filter(s => !releaseStories.has(s.id))

  return (
    <div className={css['sm-column']}>
      <div className={css['sm-persona']}>
        <span className={css['sm-persona__badge']}>{persona}</span>
        {need.persona}
      </div>

      <div className={css['sm-need']}>
        <div className={css['sm-need__id']}>{need.id}</div>
        {need.need}
      </div>

      {inRelease.map(story => (
        <div key={story.id} className={css['sm-column']}>
          <StoryCard story={story} />
          {story.features.map(f => (
            <FeatureCard key={f.id} feature={f} />
          ))}
        </div>
      ))}

      {rest.map(story => (
        <div key={story.id} className={css['sm-column']}>
          <StoryCard story={story} />
          {story.features.map(f => (
            <FeatureCard key={f.id} feature={f} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function PageStoryMap() {
  const data = useMemo(() => parseStoryMap(storiesRaw), [])

  const firstRelease = data.releases[0]
  const releaseStories = useMemo(
    () => new Set(firstRelease?.stories ?? []),
    [firstRelease],
  )

  return (
    <div className={css.sm}>
      <div className={css['sm-header']}>
        <span className={css['sm-header__title']}>USER STORY MAP</span>
        <div className={css['sm-legend']}>
          <div className={css['sm-legend__item']}>
            <span
              className={`${css['sm-story__status']} ${css['sm-story__status--pending']}`}
            />
            pending
          </div>
          <div className={css['sm-legend__item']}>
            <span
              className={`${css['sm-story__status']} ${css['sm-story__status--done']}`}
            />
            done
          </div>
          {data.screens.map(s => (
            <div key={s.id} className={css['sm-legend__item']}>
              <span className={css['sm-feature__screen-tag']}>{s.id}</span>
              {s.name}
            </div>
          ))}
        </div>
      </div>
      <div className={css['sm-body']}>
        <div className={css['sm-grid']}>
          {data.needs.map(need => (
            <NeedColumn
              key={need.id}
              need={need}
              releaseStories={releaseStories}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
