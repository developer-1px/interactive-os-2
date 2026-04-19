// ② 2026-04-08-a2ui-composites-prd.md
import { useState } from 'react'
import type { A2UIRenderContext } from '../a2uiComponentMap'
import { ax } from '@styles/ax'
import { TabList } from '../TabList'
import { ROOT_ID } from '@os/store/types'
import { createStore } from '@os/store/createStore'

// eslint-disable-next-line complexity
export function StepWizardRenderer({ entity, store, renderNode, depth }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const title = d.title as string | undefined
  const subtitle = d.subtitle as string | undefined
  const steps = (d.steps as Array<{ title: string; content: string }>) ?? []
  const [activeIndex, setActiveIndex] = useState(0)

  if (steps.length === 0) return null

  // Single step: no tab bar
  if (steps.length === 1) {
    return (
      <div className={ax({ layout: 'stack' })}>
        {title && <div className={ax({ textStyle: 'page' })}>{title}</div>}
        {subtitle && <div className={ax({ textStyle: 'caption',  })}>{subtitle}</div>}
        {store.entities[steps[0].content] && renderNode(steps[0].content, depth + 1)}
      </div>
    )
  }

  const tabStore = createStore({
    entities: Object.fromEntries(
      steps.map((step, i) => {
        const id = `step-${i}`
        return [id, { id, data: { label: step.title } }]
      }),
    ),
    relationships: { [ROOT_ID]: steps.map((_, i) => `step-${i}`) },
  })

  return (
    <div className={ax({ layout: 'stack' })}>
      {title && <div className={ax({ textStyle: 'page' })}>{title}</div>}
      {subtitle && <div className={ax({ textStyle: 'caption',  })}>{subtitle}</div>}
      <TabList
        data={tabStore}
        plugins={[]}
        aria-label={title ?? 'Steps'}
        onActivate={(nodeId) => {
          const idx = parseInt(nodeId.replace('step-', ''), 10)
          if (!isNaN(idx)) setActiveIndex(idx)
        }}
      />
      <div className={ax({ })}>
        {steps[activeIndex]?.content && store.entities[steps[activeIndex].content]
          ? renderNode(steps[activeIndex].content, depth + 1)
          : null}
      </div>
    </div>
  )
}
