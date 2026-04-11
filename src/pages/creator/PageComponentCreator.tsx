import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout'
import { creatorWidgets } from './creatorWidgets'

const creatorLayout = definePage({
  entities: {
    root:     { data: { type: 'split', direction: 'horizontal', sizes: [0.15, 'flex'] }, children: ['sidebar', 'main'] },
    sidebar:  { data: { type: 'widget', widget: 'CreatorSidebar' } },
    main:     { data: { type: 'split', direction: 'vertical', sizes: [0.55, 0.45] }, children: ['preview', 'source'] },
    preview:  { data: { type: 'widget', widget: 'CreatorPreview' } },
    source:   { data: { type: 'widget', widget: 'CreatorSource' } },
  },
})

export default function PageComponentCreator() {
  return (
    <FlatLayout
      data={creatorLayout}
      registry={creatorWidgets}
      onChange={() => {}}
      aria-label="Component creator"
    />
  )
}
