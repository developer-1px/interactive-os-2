import { ax } from '@styles/ax'
import { NavList } from '@os/ui/NavList'
import { EmptyState } from '@os/ui/EmptyState'
import { ScrollArea } from '@os/ui/ScrollArea'
import { useStories } from './storiesContext'
import { StoryCard } from './widgets/StoryCard'

export function StoriesSidebarWidget() {
  const { listStore, onChange, selectedPath } = useStories()
  return (
    <div className={ax({ role: 'control-group', surface: 'raised', layout: 'stack', flex: '1' })}>
      <NavList
        data={listStore}
        onChange={onChange}
        initialFocus={selectedPath ?? undefined}
        aria-label="Stories"
      />
    </div>
  )
}

export function StoriesPreviewWidget() {
  const { entries, selectedPath } = useStories()
  const entry = selectedPath ? entries.find((e) => e.path === selectedPath) : null

  if (!entry) {
    return (
      <div className={ax({ layout: 'center', flex: '1' })}>
        <EmptyState title="No story selected" description="Pick a story from the sidebar" />
      </div>
    )
  }

  return (
    <ScrollArea className={ax({ flex: '1' })}>
      <div className={ax({ role: 'control-group', layout: 'stack' })}>
        <StoryCard doc={entry.doc} />
      </div>
    </ScrollArea>
  )
}
