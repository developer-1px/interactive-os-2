import { Menu, Smartphone, Tablet, Monitor, Play, Sheet } from 'lucide-react'
import type { ViewportSize } from './CmsViewportWrapper'
import type { Locale } from './cms-types'
import { LOCALES } from './cms-types'

interface CmsTopToolbarProps {
  onHamburgerClick: () => void
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  viewport: ViewportSize
  onViewportChange: (v: ViewportSize) => void
  onPresent: () => void
  hamburgerRef: React.RefObject<HTMLButtonElement | null>
  i18nSheetOpen: boolean
  onI18nSheetToggle: () => void
}

export default function CmsTopToolbar({ onHamburgerClick, locale, onLocaleChange, viewport, onViewportChange, onPresent, hamburgerRef, i18nSheetOpen, onI18nSheetToggle }: CmsTopToolbarProps) {
  return (
    <header className="cms-top-toolbar">
      <button ref={hamburgerRef} className="cms-top-toolbar__btn" onClick={onHamburgerClick} title="Menu" type="button">
        <Menu size={16} />
      </button>
      <select
        className="cms-top-toolbar__locale"
        value={locale}
        onChange={e => onLocaleChange(e.target.value as Locale)}
      >
        {LOCALES.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
      <button
        className={`cms-top-toolbar__btn${i18nSheetOpen ? ' cms-top-toolbar__btn--active' : ''}`}
        onClick={onI18nSheetToggle}
        title="Translation sheet"
        type="button"
      >
        <Sheet size={14} />
      </button>
      <div className="cms-top-toolbar__spacer" />
      {([['mobile', Smartphone], ['tablet', Tablet], ['desktop', Monitor]] as const).map(([v, Icon]) => (
        <button
          key={v}
          type="button"
          className={`cms-top-toolbar__btn${viewport === v ? ' cms-top-toolbar__btn--active' : ''}`}
          onClick={() => onViewportChange(v as ViewportSize)}
          title={v}
        >
          <Icon size={14} />
        </button>
      ))}
      <button className="cms-top-toolbar__btn" onClick={onPresent} title="Present" type="button">
        <Play size={14} />
      </button>
    </header>
  )
}
