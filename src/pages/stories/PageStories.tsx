import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import { PanelHeader } from '@os/ui/PanelHeader'
import { loadStories } from './storiesStore'
import { StoryCard } from './widgets/StoryCard'

const stories = loadStories()

export default function PageStories() {
  return (
    <div className={ax({ layout: 'column', flex: '1' })}>
      <PanelHeader>
        <span className={ax({ textStyle: 'label', weight: 'semi' })}>Stories</span>
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>{stories.length} stories</span>
      </PanelHeader>

      <ScrollArea className={ax({ flex: '1' })}>
        <div className={ax({ layout: 'column', gap: 'lg', padding: 'lg' })}>
          {stories.map(entry => (
            <StoryCard key={entry.path} doc={entry.doc} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
