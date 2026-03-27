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

function StoryColumn({ story }: { story: Story }) {
  return (
    <div className={css.smStoryCol}>
      <StoryCard story={story} />
      {story.features.map(f => (
        <FeatureCard key={f.id} feature={f} />
      ))}
    </div>
  )
}

function NeedGroup({ need }: { need: Need }) {
  const persona = need.persona === 'admin' ? '관' : '디'

  return (
    <div className={css.smNeedGroup}>
      <div className={css.smNeedHeader}>
        <div className={css.smNeedHeader__top}>
          <span className={css.smPersonaBadge}>{persona}</span>
          {need.id} · {need.persona}
        </div>
        {need.need}
      </div>
      <div className={css.smStoriesRow}>
        {need.stories.map(story => (
          <StoryColumn key={story.id} story={story} />
        ))}
      </div>
    </div>
  )
}

export default function PageStoryMap() {
  const data = useMemo(() => parseStoryMap(storiesRaw), [])

  return (
    <div className={css.sm}>
      <div className={css.smHeader}>
        <span className={css.smHeader__title}>USER STORY MAP</span>
        <div className={css.smLegend}>
          <div className={css.smLegend__item}>
            <span className={`${css.smStory__status} ${css['smStory__status--pending']}`} />
            pending
          </div>
          <div className={css.smLegend__item}>
            <span className={`${css.smStory__status} ${css['smStory__status--done']}`} />
            done
          </div>
        </div>
      </div>
      <div className={css.smBody}>
        <div className={css.smMap}>
          {data.needs.map(need => (
            <NeedGroup key={need.id} need={need} />
          ))}
        </div>
      </div>
    </div>
  )
}
