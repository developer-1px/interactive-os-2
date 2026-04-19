// ② flatlayout-pull-transition-prd.md
import { ChevronLeft, ChevronRight, X, Star, Search, Layers, List } from 'lucide-react'
import { MarkdownPreview } from '@os/ui/MarkdownPreview'
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

// ── 3-pane widgets ──

function BookChapterHeader() {
  return (
    <div className={`book-panel-header ${ax({ textStyle: 'overline' })}`}>CHAPTERS</div>
  )
}

function BookChapterList() {
  const { chapterStore, onChapterActivate } = useBook()

  return (
    <ScrollArea>
      <NavList
        data={chapterStore}
        onActivate={onChapterActivate}
        aria-label="Chapters"
      />
    </ScrollArea>
  )
}

function BookPageHeader() {
  const { currentChapterLabel } = useBook()

  return (
    <div className={`book-panel-header ${ax({ textStyle: 'caption' })}`}>{currentChapterLabel}</div>
  )
}

function BookPageList() {
  const { chapterPageStore, onPageListActivate } = useBook()

  return (
    <ScrollArea>
      <NavList
        data={chapterPageStore}
        onActivate={onPageListActivate}
        aria-label="Pages"
      />
    </ScrollArea>
  )
}

// ── Reader widgets ──

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
      {page && <MarkdownPreview content={page.content} linkTransform={linkTransform} config={showcaseMdConfig} />}
    </SpreadReader>
  )
}

function BookPill() {
  const { page, chromeVisible, currentIsFavorite, onToggleFavorite, onOpenToc, onOpenLayerOverlay, onOpenQuickOpen } = useBook()

  return (
    <div className={`book-pill ${ax({ role: 'control-group', surface: 'overlay', width: 'fit', layout: 'bar' })}`} data-visible={chromeVisible}>
      <Button icon variant="ghost" onClick={onOpenToc} aria-label="Open table of contents">
        <List size={14} />
      </Button>
      <span className={ax({ textStyle: 'caption', flex: 'none' })}>{page?.chapter}</span>
      <span className={ax({ textStyle: 'caption', flex: 'none' })}>{page?.title}</span>
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
        <span className={ax({ })}>Previous <span className={ax({ })}>{prevPage.title}</span></span>
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
        <span className={ax({ })}>Next <span className={ax({ })}>{nextPage.title}</span></span>
      )}
      <ChevronRight size={14} />
    </Button>
  )
}

function BookFooter() {
  const { currentPage, totalPages, chapterName, chapterPageIndex, chapterPageCount, page } = useBook()

  return (
    <div className={`book-page-number ${ax({ layout: 'bar', textStyle: 'caption' })}`} data-page-id={page?.id}>
      <span className={ax({ })}>{chapterName}</span>
      <span className={ax({ })}>{chapterPageIndex + 1}/{chapterPageCount}</span>
      <span className={ax({ })}>·</span>
      <span className={ax({ })}>{currentPage + 1}/{totalPages}</span>
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
    <div className={ax({ layout: 'stack', width: 'lg' })}>
      <div className={ax({ layout: 'spread' })}>
        <span className={ax({ textStyle: 'section' })}>Contents</span>
        <Button icon variant="ghost" onClick={onTocClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>
      <ScrollArea className={ax({ })}>
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
      <div className={ax({ layout: 'spread' })}>
        <span className={ax({ textStyle: 'section' })}>Add to Layer</span>
        <span className={ax({ textStyle: 'caption' })}>Cmd+L</span>
      </div>
      {layerNameMode ? (
        <form className={ax({ })} onSubmit={(e) => { e.preventDefault(); onLayerNameSubmit() }}>
          <TextInput
            value={layerNameInput}
            onChange={(e) => onLayerNameChange(e.target.value)}
            placeholder="Layer name..."
            autoFocus
          />
        </form>
      ) : (
        <ScrollArea className={ax({ })}>
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
  BookChapterHeader,
  BookChapterList,
  BookPageHeader,
  BookPageList,
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
