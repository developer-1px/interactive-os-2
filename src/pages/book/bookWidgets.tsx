// ② flatlayout-pull-transition-prd.md
import { ChevronLeft, ChevronRight, X, Star, Search, Layers, List } from 'lucide-react'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { showcaseMdConfig } from '../showcase/mdConfig'
import { TocNavList } from '@os/ui/TocNavList'
import { SpreadReader } from '@os/ui/SpreadReader'
import { QuickOpen } from '@os/ui/QuickOpen'
import { NavList } from '@os/ui/NavList'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import { TextInput } from '@os/ui/TextInput'
import { Button } from '@os/ui/Button'
import { createWidgetRegistry } from '@os/layout'
import { useBook } from './bookContext'

// ── Widgets ──

function BookReader() {
  const { page, linkTransform, arrivedFromNext, onNextBoundary, onPrevBoundary, onSpreadChange } = useBook()

  return (
    <SpreadReader
      resetKey={page?.id}
      initialSpread={arrivedFromNext ? 'last' : 'first'}
      onNextBoundary={onNextBoundary}
      onPrevBoundary={onPrevBoundary}
      onSpreadChange={onSpreadChange}
    >
      {page && <MarkdownViewer content={page.content} linkTransform={linkTransform} config={showcaseMdConfig} />}
    </SpreadReader>
  )
}

function BookPill() {
  const { page, chromeVisible, currentIsFavorite, onToggleFavorite, onOpenToc, onOpenLayerOverlay, onOpenQuickOpen } = useBook()

  return (
    <div className={`book-pill ${ax({ surface: 'overlay', width: 'fit', layout: 'bar', gap: 'sm', padding: 'sm', shape: 'pill' })}`} data-visible={chromeVisible}>
      <Button icon variant="ghost" onClick={onOpenToc} aria-label="Open table of contents">
        <List size={14} />
      </Button>
      <span className={ax({ textStyle: 'caption', text: 'muted', flex: 'none' })}>{page?.chapter}</span>
      <span className={ax({ textStyle: 'caption', text: 'secondary', flex: 'none' })}>{page?.title}</span>
      <Button icon variant="ghost" onClick={onToggleFavorite} aria-label={currentIsFavorite ? 'Remove from favorites' : 'Add to favorites'}>
        <Star size={12} fill={currentIsFavorite ? 'currentColor' : 'none'} />
      </Button>
      <Button icon variant="ghost" onClick={onOpenLayerOverlay} aria-label="Add to layer">
        <Layers size={12} />
      </Button>
      <Button icon variant="ghost" onClick={onOpenQuickOpen} aria-label="Quick open">
        <Search size={12} />
      </Button>
    </div>
  )
}

function BookPrevButton() {
  const { isFirstSpread, prevPage, spread, onPrevBoundary } = useBook()

  if (isFirstSpread) return <div />

  return (
    <Button variant="ghost" onClick={onPrevBoundary}>
      <ChevronLeft size={14} />
      {spread === 0 && prevPage && (
        <span className={ax({ text: 'muted' })}>Previous <span className={ax({ text: 'bright' })}>{prevPage.title}</span></span>
      )}
    </Button>
  )
}

function BookNextButton() {
  const { isLastSpread, nextPage, spread, totalSpreads, onNextBoundary } = useBook()

  if (isLastSpread) return <div />

  return (
    <Button variant="ghost" onClick={onNextBoundary}>
      {spread >= totalSpreads - 1 && nextPage && (
        <span className={ax({ text: 'muted' })}>Next <span className={ax({ text: 'bright' })}>{nextPage.title}</span></span>
      )}
      <ChevronRight size={14} />
    </Button>
  )
}

function BookFooter() {
  const { currentPage, totalPages, chapterName, chapterPageIndex, chapterPageCount } = useBook()

  return (
    <div className={ax({ layout: 'bar', gap: 'sm', textStyle: 'caption', opacity: 'dim' })}>
      <span className={ax({ text: 'secondary' })}>{chapterName}</span>
      <span className={ax({ text: 'muted' })}>{chapterPageIndex + 1}/{chapterPageCount}</span>
      <span className={ax({ text: 'muted', opacity: 'dim' })}>·</span>
      <span className={ax({ text: 'muted', opacity: 'dim' })}>{currentPage + 1}/{totalPages}</span>
    </div>
  )
}

function BookProgress() {
  const { progressPercent } = useBook()

  return (
    <div className="book-progress-bar">
      <div className="book-progress-fill" style={{ '--progress': `${progressPercent}%` } as React.CSSProperties} />
    </div>
  )
}

function BookTocOverlay() {
  const { tocStore, onTocActivate, onTocClose } = useBook()

  return (
    <div className={ax({ scroll: 'hidden', layout: 'stack', width: 'lg' })}>
      <div className={ax({ layout: 'spread', padding: 'md', border: 'bottom' })}>
        <span className={ax({ textStyle: 'section', text: 'bright' })}>Contents</span>
        <Button icon variant="ghost" onClick={onTocClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>
      <ScrollArea className={ax({ padding: 'sm' })}>
        <TocNavList
          data={tocStore}
          onActivate={onTocActivate}
          aria-label="Table of contents"
        />
      </ScrollArea>
    </div>
  )
}

function BookQuickOpen() {
  const { quickOpenVisible, quickOpenStore, quickOpenFilter, onQueryChange, onQuickOpenActivate, onQuickOpenClose } = useBook()

  if (!quickOpenVisible) return null

  return (
    <QuickOpen
      data={quickOpenStore}
      query={quickOpenFilter}
      onQueryChange={onQueryChange}
      onActivate={onQuickOpenActivate}
      onClose={onQuickOpenClose}
      placeholder="Search pages..."
      aria-label="Quick open"
      dialog={false}
    />
  )
}

function BookLayerOverlay() {
  const { addToLayerStore, onLayerActivate, layerNameMode, layerNameInput, onLayerNameChange, onLayerNameSubmit } = useBook()

  return (
    <div className={ax({ layout: 'stack', width: 'lg' })}>
      <div className={ax({ layout: 'spread', padding: 'md', border: 'bottom' })}>
        <span className={ax({ textStyle: 'section', text: 'bright' })}>Add to Layer</span>
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>Cmd+L</span>
      </div>
      {layerNameMode ? (
        <form className={ax({ padding: 'md' })} onSubmit={(e) => { e.preventDefault(); onLayerNameSubmit() }}>
          <TextInput
            value={layerNameInput}
            onChange={(e) => onLayerNameChange(e.target.value)}
            placeholder="Layer name..."
            autoFocus
          />
        </form>
      ) : (
        <ScrollArea className={ax({ padding: 'sm' })}>
          <NavList
            data={addToLayerStore}
            onActivate={onLayerActivate}
            aria-label="Add to layer"
          />
        </ScrollArea>
      )}
    </div>
  )
}

// ── Widget registry ──

export const bookWidgets = createWidgetRegistry({
  BookReader,
  BookPill,
  BookPrevButton,
  BookNextButton,
  BookFooter,
  BookProgress,
  BookTocOverlay,
  BookQuickOpen,
  BookLayerOverlay,
})
