// ② flatlayout-pull-transition-prd.md
import { ChevronLeft, ChevronRight, X, Star, Search, Layers, List } from 'lucide-react'
import { Breadcrumb } from '@os/ui/Breadcrumb'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
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
      {page && <MarkdownViewer content={page.content} linkTransform={linkTransform} />}
    </SpreadReader>
  )
}

function BookPill() {
  const { page, chromeVisible, currentIsFavorite, onToggleFavorite, onOpenToc, onOpenLayerOverlay, onOpenQuickOpen, layerCount } = useBook()

  return (
    <div className={`book-pill ${ax({ surface: 'overlay', placement: 'top-start', width: 'fit', layout: 'bar', gap: 'sm', padding: 'sm', shape: 'pill' })}`} data-visible={chromeVisible}>
      <button
        className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: 'secondary', flex: 'none' })} book-pill-btn`}
        onClick={onOpenToc}
        aria-label="Open table of contents"
      >
        <List size={14} />
      </button>
      <span className={ax({ textStyle: 'caption', text: 'muted', clamp: '1' })}>{page?.chapter}</span>
      <span className={ax({ textStyle: 'caption', text: 'secondary', clamp: '1' })}>{page?.title}</span>
      <button
        className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: currentIsFavorite ? 'bright' : 'muted', flex: 'none' })} book-pill-btn`}
        onClick={onToggleFavorite}
        aria-label={currentIsFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star size={12} fill={currentIsFavorite ? 'currentColor' : 'none'} />
      </button>
      <button
        className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: layerCount > 0 ? 'bright' : 'muted', flex: 'none' })} book-pill-btn`}
        onClick={onOpenLayerOverlay}
        aria-label="Add to layer"
      >
        <Layers size={12} />
      </button>
      <button
        className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: 'secondary', flex: 'none' })} book-pill-btn`}
        onClick={onOpenQuickOpen}
        aria-label="Quick open"
      >
        <Search size={12} />
      </button>
    </div>
  )
}

function BookPrevButton() {
  const { isFirstSpread, prevPage, spread, onPrevBoundary } = useBook()

  if (isFirstSpread) return <div />

  return (
    <Button variant="ghost" size="sm" onClick={onPrevBoundary}>
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
    <Button variant="ghost" size="sm" onClick={onNextBoundary}>
      {spread >= totalSpreads - 1 && nextPage && (
        <span className={ax({ text: 'muted' })}>Next <span className={ax({ text: 'bright' })}>{nextPage.title}</span></span>
      )}
      <ChevronRight size={14} />
    </Button>
  )
}

function BookFooter() {
  const { page, currentPage, totalPages } = useBook()

  return (
    <div className={`${ax({ layout: 'bar', gap: 'sm', textStyle: 'caption', text: 'muted', placement: 'bottom-center' })} book-page-number`}>
      {page && <Breadcrumb path={page.id} root="" />}
      <span>{currentPage + 1}/{totalPages}</span>
    </div>
  )
}

function BookProgress() {
  const { chromeVisible, progressPercent } = useBook()

  return (
    <div className={`${ax({ placement: 'bottom' })} book-progress-bar`} data-visible={chromeVisible}>
      <div className="book-progress-fill" style={{ '--progress': `${progressPercent}%` } as React.CSSProperties} />
    </div>
  )
}

function BookTocOverlay() {
  const { tocOpen, tocStore, onTocActivate, onTocClose } = useBook()

  return (
    <div className={`${ax({ placement: 'center', layout: 'center' })} book-toc-overlay`} data-open={tocOpen}>
      <div className={`${ax({ scroll: 'hidden', layout: 'column' })} book-toc-panel`}>
        <div className={ax({ layout: 'spread', padding: 'md', border: 'bottom' })}>
          <span className={ax({ textStyle: 'section', text: 'bright' })}>Contents</span>
          <button
            className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: 'secondary', flex: 'none' })} book-pill-btn`}
            onClick={onTocClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <ScrollArea className={ax({ padding: 'sm' })}>
          <TocNavList
            data={tocStore}
            onActivate={onTocActivate}
            aria-label="Table of contents"
          />
        </ScrollArea>
      </div>
    </div>
  )
}

function BookQuickOpen() {
  const { quickOpenVisible, quickOpenStore, quickOpenFilter, onQueryChange, onQuickOpenActivate, onQuickOpenClose } = useBook()

  return (
    <div
      className={`${ax({ placement: 'center' })} book-quick-open-overlay`}
      data-open={quickOpenVisible}
      onClick={(e) => { if (e.target === e.currentTarget) onQuickOpenClose() }}
    >
      {quickOpenVisible && (
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
      )}
    </div>
  )
}

function BookLayerOverlay() {
  const { layerOverlayVisible, addToLayerStore, onLayerActivate, onLayerClose, layerNameMode, layerNameInput, onLayerNameChange, onLayerNameSubmit } = useBook()

  return (
    <div
      className={`${ax({ placement: 'center' })} book-quick-open-overlay`}
      data-open={layerOverlayVisible}
      onClick={(e) => { if (e.target === e.currentTarget) onLayerClose() }}
    >
      <div className={`${ax({ surface: 'overlay', width: 'lg', shape: 'xl' })} book-quick-open-panel`}>
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
