import { useMemo } from 'react'
import { parseStoryMap } from './storyMapSchema'
import type { Need, Story, Feature } from './storyMapSchema'
import css from './PageStoryMap.module.css'

import storiesRaw from '../../../docs/2-areas/apps/cms/stories.yaml?raw'

function StoryCard({ story }: { story: Story }) {
  return (
    <div className={css.smStory}>
      <div className={css.smStory__header}>
        <span className={css.smStory__id}>{story.id}</span>
        <span
          className={`${css.smStory__status} ${story.status === 'done' ? css['smStory__status--done'] : css['smStory__status--pending']}`}
        />
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
      <div className={css.smFeature__text}>
        <span className={css.smFeature__id}>{feature.id}</span>
        {feature.feature}
      </div>
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

function NeedColumn({ need, releaseStories }: { need: Need; releaseStories: Set<string> }) {
  const persona = need.persona === 'admin' ? '관' : '디'

  const inRelease = need.stories.filter(s => releaseStories.has(s.id))
  const rest = need.stories.filter(s => !releaseStories.has(s.id))

  return (
    <div className={css.smColumn}>
      <div className={css.smPersona}>
        <span className={css.smPersona__badge}>{persona}</span>
        {need.persona}
      </div>

      <div className={css.smNeed}>
        <div className={css.smNeed__id}>{need.id}</div>
        {need.need}
      </div>

      {inRelease.map(story => (
        <div key={story.id} className={css.smColumn}>
          <StoryCard story={story} />
          {story.features.map(f => (
            <FeatureCard key={f.id} feature={f} />
          ))}
        </div>
      ))}

      {rest.map(story => (
        <div key={story.id} className={css.smColumn}>
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
      <div className={css.smHeader}>
        <span className={css.smHeader__title}>USER STORY MAP</span>
        <div className={css.smLegend}>
          <div className={css.smLegend__item}>
            <span
              className={`${css.smStory__status} ${css['smStory__status--pending']}`}
            />
            pending
          </div>
          <div className={css.smLegend__item}>
            <span
              className={`${css.smStory__status} ${css['smStory__status--done']}`}
            />
            done
          </div>
          {data.screens.map(s => (
            <div key={s.id} className={css.smLegend__item}>
              <span className={css.smFeature__screenTag}>{s.id}</span>
              {s.name}
            </div>
          ))}
        </div>
      </div>
      <div className={css.smBody}>
        <div className={css.smGrid}>
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
