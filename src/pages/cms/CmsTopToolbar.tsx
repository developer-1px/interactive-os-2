import { Menu, Smartphone, Tablet, Monitor, Play } from 'lucide-react'
import type { Locale } from './cms-types'
import { LOCALES } from './cms-types'

export type ViewportSize = 'mobile' | 'tablet' | 'desktop'

interface CmsTopToolbarProps {
  onHamburgerClick: () => void
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  viewport: ViewportSize
  onViewportChange: (v: ViewportSize) => void
  onPresent: () => void
  hamburgerRef: React.RefObject<HTMLButtonElement | null>
}

export default function CmsTopToolbar({ onHamburgerClick, locale, onLocaleChange, viewport, onViewportChange, onPresent, hamburgerRef }: CmsTopToolbarProps) {
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
