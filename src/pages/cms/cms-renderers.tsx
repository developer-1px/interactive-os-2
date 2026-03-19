/* eslint-disable react-refresh/only-export-components */
import {
  Database, Cog, Keyboard, Shield,
  ChevronRight, ArrowRight,
  List, Grid3X3, ToggleLeft, MessageSquare,
  PanelTop, ChevronDown, MousePointerClick,
  Layers, Table, Radio, Menu,
} from 'lucide-react'
import { localized } from './cms-types'
import type { Locale } from './cms-types'
import type { NodeState } from '../../interactive-os/behaviors/types'

// ── Icon lookup (since JSX can't live in store data) ──

export const featureIcons: Record<string, React.ReactNode> = {
  database: <Database size={16} />,
  cog: <Cog size={16} />,
  shield: <Shield size={16} />,
  keyboard: <Keyboard size={16} />,
}

export const patternIcons: Record<string, React.ReactNode> = {
  table: <Table size={12} />,
  list: <List size={12} />,
  paneltop: <PanelTop size={12} />,
  message: <MessageSquare size={12} />,
  grid: <Grid3X3 size={12} />,
  menu: <Menu size={12} />,
  layers: <Layers size={12} />,
  chevrondown: <ChevronDown size={12} />,
  chevronright: <ChevronRight size={12} />,
  keyboard: <Keyboard size={12} />,
  click: <MousePointerClick size={12} />,
  toggle: <ToggleLeft size={12} />,
  radio: <Radio size={12} />,
  shield: <Shield size={12} />,
}

// ── Node content renderers by type ──

export function NodeContent({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  switch (data.type) {
    case 'text':
      return <>{localized(data.value as string, locale).text}</>
    case 'cta':
      return (
        <div className="cms-hero__actions">
          <button type="button" className="cms-hero__cta">
            {localized(data.primary as string, locale).text} <ArrowRight size={14} />
          </button>
          <button type="button" className="cms-hero__cta-secondary">
            {localized(data.secondary as string, locale).text} <ChevronRight size={14} />
          </button>
        </div>
      )
    case 'stat':
      return (
        <>
          <span className="cms-stat__value">{localized(data.value as string, locale).text}</span>
          <span className="cms-stat__label">{localized(data.label as string, locale).text}</span>
        </>
      )
    case 'icon':
      return <>{featureIcons[data.value as string] ?? null}</>
    case 'step':
      return (
        <>
          <span className="cms-step__number">{data.num as string}</span>
          <h3 className="cms-step__title">{localized(data.title as string, locale).text}</h3>
          <p className="cms-step__desc">{localized(data.desc as string, locale).text}</p>
        </>
      )
    case 'pattern':
      return (
        <>
          <div className="cms-pattern__icon">{patternIcons[data.icon as string] ?? null}</div>
          <span className="cms-pattern__name">{localized(data.name as string, locale).text}</span>
        </>
      )
    case 'brand':
      return (
        <>
          <div className="cms-footer__logo" />
          <span className="cms-footer__name">{data.name as string}</span>
          <span className="cms-footer__copy">{data.license as string} License</span>
        </>
      )
    case 'badge':
      return <><span className="cms-hero__badge-dot" />{localized(data.value as string, locale).text}</>
    case 'section-label':
    case 'section-title':
    case 'section-desc':
      return <>{localized(data.value as string, locale).text}</>
    case 'links':
      return null
    case 'link':
      return <a className="cms-footer__link" href={data.href as string}>{localized(data.label as string, locale).text}</a>
    default:
      return null
  }
}


// ── CSS class mapping ──

export function getSectionClassName(variant: string): string {
  switch (variant) {
    case 'hero': return 'cms-hero'
    case 'stats': return 'cms-stats'
    case 'features': return 'cms-features'
    case 'workflow': return 'cms-how'
    case 'patterns': return 'cms-patterns'
    case 'footer': return 'cms-footer'
    default: return ''
  }
}

export function getNodeClassName(data: Record<string, string>, state: NodeState): string {
  const f = state.focused
  switch (data.type) {
    case 'section':
      return getSectionClassName(data.variant)
    case 'stat':
      return `cms-stat${f ? ' cms-stat--focused' : ''}`
    case 'card':
      return `cms-feature-card${f ? ' cms-feature-card--focused' : ''}`
    case 'step':
      return `cms-step${f ? ' cms-step--focused' : ''}`
    case 'pattern':
      return `cms-pattern${f ? ' cms-pattern--focused' : ''}`
    case 'text': {
      if (data.role === 'hero-title') return 'cms-hero__title'
      if (data.role === 'hero-subtitle') return 'cms-hero__subtitle'
      if (data.role === 'title') return 'cms-feature-card__title'
      if (data.role === 'desc') return 'cms-feature-card__desc'
      return ''
    }
    case 'section-label': return 'cms-section-label'
    case 'section-title': return 'cms-section-title'
    case 'section-desc': return 'cms-section-desc'
    case 'badge': return 'cms-hero__badge'
    case 'cta': return ''
    case 'icon': return 'cms-feature-card__icon'
    case 'brand': return 'cms-footer__brand'
    case 'links': return 'cms-footer__links'
    case 'link': return ''
    default: return ''
  }
}

// Section header types — rendered before the grid container
export const HEADER_TYPES = new Set(['section-label', 'section-title', 'section-desc', 'badge', 'text', 'cta'])

export function getChildrenContainerClassName(data: Record<string, string>): string | undefined {
  switch (data.variant) {
    case 'stats': return 'cms-stats__items'
    case 'features': return 'cms-features__grid'
    case 'workflow': return 'cms-how__steps'
    case 'patterns': return 'cms-patterns__grid'
    default: return undefined
  }
}

// ── What HTML tag to use ──

export function getNodeTag(data: Record<string, string>): keyof React.JSX.IntrinsicElements {
  if (data.type === 'section') {
    if (data.variant === 'footer') return 'footer'
    return 'section'
  }
  if (data.type === 'text') {
    if (data.role === 'hero-title') return 'h1'
    if (data.role === 'hero-subtitle') return 'p'
    if (data.role === 'title') return 'h3'
    if (data.role === 'desc') return 'p'
  }
  if (data.type === 'section-label') return 'p'
  if (data.type === 'section-title') return 'h2'
  if (data.type === 'section-desc') return 'p'
  if (data.type === 'links') return 'nav'
  return 'div'
}
