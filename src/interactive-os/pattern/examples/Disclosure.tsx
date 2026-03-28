import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { disclosure } from '../../pattern/roles/disclosure'
import { EXPANDED_ID } from '../../axis/expand'
import styles from './disclosure.module.css'

// APG #19: Disclosure (Show/Hide)
// https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/

const items = [
  {
    id: 'nutrition-facts',
    label: 'Nutrition Facts',
    contentId: 'nutrition-facts-content',
    content:
      'Serving size 1 cup (240ml). Calories 150. Total Fat 8g (10% DV). Sodium 430mg (19% DV). Total Carbohydrate 12g (4% DV). Protein 5g.',
  },
  {
    id: 'ingredients',
    label: 'Ingredients',
    contentId: 'ingredients-content',
    content:
      'Water, enriched wheat flour, sugar, soybean oil, salt, leavening agents, natural flavors.',
  },
  {
    id: 'directions',
    label: 'Directions',
    contentId: 'directions-content',
    content:
      'Preheat oven to 350°F. Place on ungreased baking sheet. Bake 10-12 minutes or until golden brown. Let cool before serving.',
  },
]

const data: NormalizedData = createStore({
  entities: {
    ...Object.fromEntries(
      items.map(it => [it.id, { id: it.id, data: { label: it.label } }]),
    ),
    ...Object.fromEntries(
      items.map(it => [
        it.contentId,
        { id: it.contentId, data: { label: it.content } },
      ]),
    ),
    [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['nutrition-facts'] },
  },
  relationships: {
    [ROOT_ID]: items.map(it => it.id),
    ...Object.fromEntries(
      items.map(it => [it.id, [it.contentId]]),
    ),
  },
})

const renderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  const isButton = (state.level ?? 1) === 1

  if (isButton) {
    return (
      <div
        {...props}
        className={styles.button}
        data-focused={state.focused || undefined}
      >
        <span className={styles.indicator} aria-hidden="true">
          {state.expanded ? '\u25BC' : '\u25B6'}
        </span>
        <span>{label}</span>
      </div>
    )
  }

  return (
    <div {...props} className={styles.panel}>
      {label}
    </div>
  )
}

export function Disclosure() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => disclosure, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Disclosure Example"
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
