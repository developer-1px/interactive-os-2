import { useState } from 'react'
import { Up, Down } from './kbdIcons'
import { ListBox } from '../interactive-os/ui/ListBox'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData, Entity } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'
import { core } from '../interactive-os/plugins/core'
import { typeahead } from '../interactive-os/plugins/typeahead'

const fruitData = createStore({
  entities: {
    apple: { id: 'apple', data: { label: 'Apple', emoji: '\u{1F34E}' } },
    apricot: { id: 'apricot', data: { label: 'Apricot', emoji: '\u{1F351}' } },
    avocado: { id: 'avocado', data: { label: 'Avocado', emoji: '\u{1F951}' } },
    banana: { id: 'banana', data: { label: 'Banana', emoji: '\u{1F34C}' } },
    blueberry: { id: 'blueberry', data: { label: 'Blueberry', emoji: '\u{1FAD0}' } },
    cherry: { id: 'cherry', data: { label: 'Cherry', emoji: '\u{1F352}' } },
    coconut: { id: 'coconut', data: { label: 'Coconut', emoji: '\u{1F965}' } },
    date: { id: 'date', data: { label: 'Date', emoji: '\u{1F334}' } },
    fig: { id: 'fig', data: { label: 'Fig', emoji: '\u{1F95D}' } },
    grape: { id: 'grape', data: { label: 'Grape', emoji: '\u{1F347}' } },
    guava: { id: 'guava', data: { label: 'Guava', emoji: '\u{1F34F}' } },
    kiwi: { id: 'kiwi', data: { label: 'Kiwi', emoji: '\u{1F95D}' } },
    lemon: { id: 'lemon', data: { label: 'Lemon', emoji: '\u{1F34B}' } },
    lime: { id: 'lime', data: { label: 'Lime', emoji: '\u{1F34B}' } },
    lychee: { id: 'lychee', data: { label: 'Lychee', emoji: '\u{1F352}' } },
    mango: { id: 'mango', data: { label: 'Mango', emoji: '\u{1F96D}' } },
    melon: { id: 'melon', data: { label: 'Melon', emoji: '\u{1F348}' } },
    orange: { id: 'orange', data: { label: 'Orange', emoji: '\u{1F34A}' } },
    papaya: { id: 'papaya', data: { label: 'Papaya', emoji: '\u{1F96D}' } },
    peach: { id: 'peach', data: { label: 'Peach', emoji: '\u{1F351}' } },
    pear: { id: 'pear', data: { label: 'Pear', emoji: '\u{1F350}' } },
    pineapple: { id: 'pineapple', data: { label: 'Pineapple', emoji: '\u{1F34D}' } },
    plum: { id: 'plum', data: { label: 'Plum', emoji: '\u{1FAD0}' } },
    raspberry: { id: 'raspberry', data: { label: 'Raspberry', emoji: '\u{1FAD0}' } },
    strawberry: { id: 'strawberry', data: { label: 'Strawberry', emoji: '\u{1F353}' } },
    watermelon: { id: 'watermelon', data: { label: 'Watermelon', emoji: '\u{1F349}' } },
  },
  relationships: {
    [ROOT_ID]: [
      'apple', 'apricot', 'avocado', 'banana', 'blueberry',
      'cherry', 'coconut', 'date', 'fig', 'grape',
      'guava', 'kiwi', 'lemon', 'lime', 'lychee',
      'mango', 'melon', 'orange', 'papaya', 'peach',
      'pear', 'pineapple', 'plum', 'raspberry', 'strawberry', 'watermelon',
    ],
  },
})

const getLabel = (entity: Entity) =>
  (entity.data as Record<string, unknown>)?.label as string ?? ''

const plugins = [core(), typeahead({ getLabel })]

export default function TypeaheadDemo() {
  const [data] = useState<NormalizedData>(fruitData)

  return (
    <>
      <div className="page-keys">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>a-z</kbd> <span className="key-hint">typeahead</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last</span>
      </div>
      <div className="card">
        <ListBox
          data={data}
          plugins={plugins}
          renderItem={(props, item, state: NodeState) => {
            const d = item.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')

            return (
              <div {...props} className={cls} style={{ justifyContent: 'flex-start' }}>
                <span style={{ marginRight: 8 }}>{d?.emoji as string}</span>
                <span className="list-item__label">{d?.label as string}</span>
              </div>
            )
          }}
        />
      </div>
    </>
  )
}
