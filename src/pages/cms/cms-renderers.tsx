/* eslint-disable react-refresh/only-export-components */
import {
  Database, Cog, Keyboard, Shield,
  ChevronRight, ArrowRight,
  List, Grid3X3, ToggleLeft, MessageSquare,
  PanelTop, ChevronDown, MousePointerClick,
  Layers, Table, Radio, Menu,
} from 'lucide-react'
import { localized } from './cms-types'
import type { Locale, LocaleMap } from './cms-types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import s from '../PageVisualCms.module.css'

function LocalizedText({ value, locale }: { value: string | LocaleMap; locale: Locale }) {
  const { text, isFallback } = localized(value, locale)
  return <span className={isFallback ? 'cms-text--fallback' : undefined}>{text}</span>
}

// ── Icon lookup (since JSX can't live in store data) ──

const featureIcons: Record<string, React.ReactNode> = {
  database: <Database size={16} />,
  cog: <Cog size={16} />,
  shield: <Shield size={16} />,
  keyboard: <Keyboard size={16} />,
}

const patternIcons: Record<string, React.ReactNode> = {
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
      return <LocalizedText value={data.value as string | LocaleMap} locale={locale} />
    case 'cta':
      return (
        <div className={s.cmsHeroActions}>
          <button type="button" className={s.cmsHeroCta}>
            <LocalizedText value={data.primary as string | LocaleMap} locale={locale} /> <ArrowRight size={14} />
          </button>
          <button type="button" className={s.cmsHeroCtaSecondary}>
            <LocalizedText value={data.secondary as string | LocaleMap} locale={locale} /> <ChevronRight size={14} />
          </button>
        </div>
      )
    case 'stat':
      return null  // container — children rendered by CmsCanvas
    case 'stat-value':
      return <>{data.value as string}</>

    case 'icon':
      return <>{featureIcons[data.value as string] ?? null}</>
    case 'step':
      return null  // container — children rendered by CmsCanvas
    case 'step-num':
      return <>{data.value as string}</>

    case 'pattern':
      return (
        <>
          <div className={s.cmsPatternIcon}>{patternIcons[data.icon as string] ?? null}</div>
          <span className={s.cmsPatternName}><LocalizedText value={data.name as string | LocaleMap} locale={locale} /></span>
        </>
      )
    case 'brand':
      return (
        <>
          <div className={s.cmsFooterLogo} />
          <span className={s.cmsFooterName}>{data.name as string}</span>
          <span className={s.cmsFooterCopy}>{data.license as string} License</span>
        </>
      )
    case 'badge':
      return <><span className={s.cmsHeroBadgeDot} /><LocalizedText value={data.value as string | LocaleMap} locale={locale} /></>
    case 'section-label':
    case 'section-title':
    case 'section-desc':
      return <LocalizedText value={data.value as string | LocaleMap} locale={locale} />
    case 'links':
      return null
    case 'link':
      return <a className={s.cmsFooterLink} href={data.href as string}><LocalizedText value={data.label as string | LocaleMap} locale={locale} /></a>
    default:
      return null
  }
}


// ── CSS class mapping ──

export function getSectionClassName(variant: string): string {
  switch (variant) {
    case 'hero': return s.cmsHero
    case 'stats': return s.cmsStats
    case 'features': return s.cmsFeatures
    case 'workflow': return s.cmsHow
    case 'patterns': return s.cmsPatterns
    case 'footer': return s.cmsFooter
    default: return ''
  }
}

export function getNodeClassName(data: Record<string, string>, state: NodeState): string {
  const f = state.focused
  switch (data.type) {
    case 'section':
      return getSectionClassName(data.variant)
    case 'stat':
      return `${s.cmsStat}${f ? ` ${s.cmsStatFocused}` : ''}`
    case 'card':
      return `${s.cmsFeatureCard}${f ? ` ${s.cmsFeatureCardFocused}` : ''}`
    case 'step':
      return `${s.cmsStep}${f ? ` ${s.cmsStepFocused}` : ''}`
    case 'pattern':
      return `${s.cmsPattern}${f ? ` ${s.cmsPatternFocused}` : ''}`
    case 'step-num':
      return s.cmsStepNumber
    case 'stat-value':
      return s.cmsStatValue
    case 'text': {
      if (data.role === 'hero-title') return s.cmsHeroTitle
      if (data.role === 'hero-subtitle') return s.cmsHeroSubtitle
      if (data.role === 'title') return s.cmsFeatureCardTitle
      if (data.role === 'desc') return s.cmsFeatureCardDesc
      if (data.role === 'step-title') return s.cmsStepTitle
      if (data.role === 'step-desc') return s.cmsStepDesc
      if (data.role === 'stat-label') return s.cmsStatLabel
      return ''
    }
    case 'section-label': return s.cmsSectionLabel
    case 'section-title': return s.cmsSectionTitle
    case 'section-desc': return s.cmsSectionDesc
    case 'badge': return s.cmsHeroBadge
    case 'cta': return ''
    case 'icon': return s.cmsFeatureCardIcon
    case 'brand': return s.cmsFooterBrand
    case 'links': return s.cmsFooterLinks
    case 'link': return ''
    default: return ''
  }
}

// Section header types — rendered before the grid container
export const HEADER_TYPES = new Set(['section-label', 'section-title', 'section-desc', 'badge', 'text', 'cta'])

export function getChildrenContainerClassName(data: Record<string, string>): string | undefined {
  switch (data.variant) {
    case 'stats': return s.cmsStatsItems
    case 'features': return s.cmsFeaturesGrid
    case 'workflow': return s.cmsHowSteps
    case 'patterns': return s.cmsPatternsGrid
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
    if (data.role === 'title' || data.role === 'step-title') return 'h3'
    if (data.role === 'desc' || data.role === 'step-desc') return 'p'
  }
  if (data.type === 'step-num') return 'span'
  if (data.type === 'stat-value') return 'span'
  if (data.type === 'section-label') return 'p'
  if (data.type === 'section-title') return 'h2'
  if (data.type === 'section-desc') return 'p'
  if (data.type === 'links') return 'nav'
  return 'div'
}

// ── Editable fields — re-export from schema (single source of truth) ──

export { getEditableFields } from './cms-schema'
