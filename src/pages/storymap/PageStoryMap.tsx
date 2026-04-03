import { useCallback, useMemo, useState } from 'react'
import { parseStoryMap } from './storyMapSchema'
import type { Need, Story, Feature, StoryMap } from './storyMapSchema'
import { ax } from '@styles/ax'
import css from './PageStoryMap.module.css'

import { TabList } from '@os/ui/TabList'
import { SpatialView } from '@os/ui/SpatialView'
import type { NormalizedData } from '@os/store/types'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

import cmsRaw from '../../../docs/2-areas/apps/cms/stories.yaml?raw'
import osRaw from '../../../docs/2-areas/interactive-os-architecture.yaml?raw'

const sources = [
  { id: 'cms', label: 'Visual CMS', raw: cmsRaw },
  { id: 'os', label: 'interactive-os', raw: osRaw },
]

const tabStore: NormalizedData = createStore({
  entities: Object.fromEntries(sources.map(s => [s.id, { id: s.id, data: { label: s.label } }])),
  relationships: { [ROOT_ID]: sources.map(s => s.id) },
})

/** Flatten all story + feature IDs into a flat NormalizedData for spatial nav */
function toSpatialStore(map: StoryMap): NormalizedData {
  const ids: string[] = []
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  for (const need of map.needs) {
    for (const story of need.stories) {
      ids.push(story.id)
      entities[story.id] = { id: story.id, data: { type: 'story' } }
      for (const feature of story.features) {
        ids.push(feature.id)
        entities[feature.id] = { id: feature.id, data: { type: 'feature' } }
      }
    }
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

function StoryCard({ story, focused }: { story: Story; focused: boolean }) {
  return (
    <div className={`${css.smStory} flex-col border-none`} data-status={story.status} data-focused={focused || undefined}>
      <div className="flex-row items-center justify-between">
        <span className={`${ax({ textStyle: 'caption', text: 'muted' })} ${css.smStoryId}`}>{story.id}</span>
        {story.status === 'blocked' && (
          <span className={`${css.smStoryBlocked} shrink-0`} />
        )}
      </div>
      <div className={`${ax({ textStyle: 'body', text: 'primary' })} ${css.smStoryText}`}>{story.story}</div>
      {story.links.length > 0 && (
        <div className={`${css.smLinks} flex-row flex-wrap`}>
          {story.links.map(link => (
            <a
              key={link.url}
              href={link.url}
              className={`${ax({ textStyle: 'caption', text: 'accent' })} ${css.smLinksItem} no-underline`}
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

function FeatureCard({ feature, focused }: { feature: Feature; focused: boolean }) {
  return (
    <div className={`${ax({ textStyle: 'caption', text: 'secondary' })} ${css.smFeature} flex-col border-none`} data-focused={focused || undefined}>
      <span className={`${ax({ text: 'muted' })} ${css.smFeatureId}`}>{feature.id}</span>
      <div className={`${ax({ text: 'secondary' })} ${css.smFeatureText}`}>{feature.feature}</div>
      {feature.screens.length > 0 && (
        <div className={`${css.smFeatureScreens} flex-row`}>
          {feature.screens.map(s => (
            <span key={s} className={`${ax({ textStyle: 'caption', weight: 'medium', text: 'muted' })} ${css.smFeatureScreenTag}`}>{s}</span>
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
  const [sourceId, setSourceId] = useState(sources[0].id)
  const activeSource = sources.find(s => s.id === sourceId) ?? sources[0]
  const data = useMemo(() => parseStoryMap(activeSource.raw), [activeSource.raw])
  const { layout, totalColumns } = useColumnLayout(data.needs)
  const spatialStore = useMemo(() => toSpatialStore(data), [data])

  const handleActivate = useCallback((nodeId: string) => {
    setSourceId(nodeId)
  }, [])

  return (
    <div className={`${css.sm} flex-col h-full overflow-hidden`}>
      <div className={`${css.smHeader} flex-row items-center shrink-0`}>
        <div className={`${css.smHeaderLeft} flex-row items-center min-w-0`}>
          <TabList
            data={tabStore}
            onActivate={handleActivate}
            initialFocus={sourceId}
            aria-label="Story map source"
          />
          <div className={`${css.smLegend} flex-row items-center shrink-0`} role="list" aria-label="Status legend">
            {(['pending', 'active', 'done', 'blocked'] as const).map(status => (
              <div key={status} className={`${ax({ textStyle: 'caption', text: 'muted' })} ${css.smLegendItem} flex-row items-center`} role="listitem">
                <span className={`${css.smLegendSwatch} shrink-0`} data-status={status} />
                {status}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={`${css.smBody} flex-1 overflow-auto`}>
        <SpatialView data={spatialStore} aria-label="Story map">
          {({ getNodeProps, getNodeState }) => (
            <div
              className={`${css.smMap} grid`}
              style={{ gridTemplateColumns: `repeat(${totalColumns}, var(--_col-width))` }}
            >
              {/* Row 1: Need headers spanning their story columns */}
              {layout.map(({ need, colStart, span }) => {
                const personaMap: Record<string, string> = { admin: '관', designer: '디', library: 'L' }
                const persona = personaMap[need.persona] ?? need.persona.charAt(0).toUpperCase()
                return (
                  <div
                    key={need.id}
                    className={`${ax({ textStyle: 'body', weight: 'medium', text: 'primary' })} ${css.smNeedHeader} flex-col`}
                    style={{ gridColumn: `${colStart} / span ${span}` }}
                  >
                    <div className={`${ax({ textStyle: 'caption', text: 'muted' })} ${css.smNeedHeaderTop} flex-row items-center`}>
                      <span className={`${ax({ textStyle: 'caption', weight: 'semi', text: 'accent' })} ${css.smPersonaBadge} inline-flex items-center justify-center`}>{persona}</span>
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
                    className={`${css.smStoryCol} grid`}
                    data-status={story.status}
                    style={{ gridColumn: colStart + i }}
                  >
                    <div {...(getNodeProps(story.id) as React.HTMLAttributes<HTMLDivElement>)}>
                      <StoryCard story={story} focused={getNodeState(story.id).focused} />
                    </div>
                    {story.features.map(f => (
                      <div key={f.id} {...(getNodeProps(f.id) as React.HTMLAttributes<HTMLDivElement>)}>
                        <FeatureCard feature={f} focused={getNodeState(f.id).focused} />
                      </div>
                    ))}
                  </div>
                )),
              )}
            </div>
          )}
        </SpatialView>
      </div>
    </div>
  )
}
