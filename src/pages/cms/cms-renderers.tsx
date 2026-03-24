// ② 2026-03-24-cms-editorial-content-prd.md
/* eslint-disable react-refresh/only-export-components */
import { createElement } from 'react'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { localized } from './cms-types'
import type { Locale, LocaleMap } from './cms-types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import s from './CmsLanding.module.css'
import { CMS_ICON_MAP } from './cmsIcons'

function LocalizedText({ value, locale }: { value: string | LocaleMap; locale: Locale }) {
  const { text, isFallback } = localized(value, locale)
  return <span className={isFallback ? 'cms-text--fallback' : undefined}>{text}</span>
}

export function CmsIcon({ name, size }: { name: string; size: number }) {
  const Icon = CMS_ICON_MAP.get(name)
  if (!Icon) return null
  return createElement(Icon, { size })
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
            <LocalizedText value={data.primary as string | LocaleMap} locale={locale} /> <ArrowRight size={16} />
          </button>
          <button type="button" className={s.cmsHeroCtaSecondary}>
            <LocalizedText value={data.secondary as string | LocaleMap} locale={locale} /> <ChevronRight size={16} />
          </button>
        </div>
      )
    case 'stat':
      return null
    case 'stat-value':
      return <>{data.value as string}</>
    case 'icon':
      return <CmsIcon name={data.value as string} size={16} />
    case 'step':
      return null
    case 'step-num':
      return <>{data.value as string}</>
    case 'pattern':
      return (
        <>
          <div className={s.cmsPatternIcon}><CmsIcon name={data.icon as string} size={12} /></div>
          <span className={s.cmsPatternName}><LocalizedText value={data.name as string | LocaleMap} locale={locale} /></span>
        </>
      )
    case 'brand':
      return (
        <>
          <div className={s.cmsFooterLogo} />
          <span className={s.cmsFooterName}><LocalizedText value={data.name as string | LocaleMap} locale={locale} /></span>
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
    case 'tab-item':
      return <LocalizedText value={data.label as LocaleMap} locale={locale} />

    // ── Editorial section types ──
    case 'value-item':
      return (
        <div className={s.cmsValueItemContent}>
          <div className={s.cmsValueItemIcon}><CmsIcon name={data.icon as string} size={24} /></div>
          <h3 className={s.cmsValueItemTitle}><LocalizedText value={data.title as LocaleMap} locale={locale} /></h3>
          <p className={s.cmsValueItemDesc}><LocalizedText value={data.desc as LocaleMap} locale={locale} /></p>
        </div>
      )
    case 'quote':
      return (
        <blockquote className={s.cmsQuoteContent}>
          <span className={s.cmsQuoteMark}>"</span>
          <p className={s.cmsQuoteText}><LocalizedText value={data.text as LocaleMap} locale={locale} /></p>
          <cite className={s.cmsQuoteAttribution}>— <LocalizedText value={data.attribution as LocaleMap} locale={locale} /></cite>
        </blockquote>
      )
    case 'article':
      return (
        <div className={s.cmsArticleContent}>
          <div className={s.cmsArticleIcon}><CmsIcon name={data.icon as string} size={20} /></div>
          <div className={s.cmsArticleBody}>
            <h3 className={s.cmsArticleTitle}><LocalizedText value={data.title as LocaleMap} locale={locale} /></h3>
            <span className={s.cmsArticleMeta}>
              <LocalizedText value={data.category as LocaleMap} locale={locale} /> · {data.readTime as string}
            </span>
          </div>
        </div>
      )
    case 'showcase-item':
      return (
        <div className={s.cmsShowcaseItemContent}>
          <div className={s.cmsShowcaseItemIcon}><CmsIcon name={data.icon as string} size={20} /></div>
          <span className={s.cmsShowcaseItemLabel}><LocalizedText value={data.label as LocaleMap} locale={locale} /></span>
          <span className={s.cmsShowcaseItemDesc}><LocalizedText value={data.desc as LocaleMap} locale={locale} /></span>
        </div>
      )
    default:
      return null
  }
}


// ── CSS class mapping ──

export function getSectionClassName(variant: string): string {
  switch (variant) {
    case 'hero':        return s.cmsHero
    case 'manifesto':   return s.cmsManifesto
    case 'features':    return s.cmsFeatures
    case 'patterns':    return s.cmsPatterns
    case 'showcase':    return s.cmsShowcase
    case 'journal':     return s.cmsJournal
    case 'testimonial': return s.cmsTestimonial
    case 'cta':         return s.cmsCta
    case 'footer':      return s.cmsFooter
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
    case 'tab-group': return `${s.cmsTabGroup}${f ? ` ${s.cmsTabGroupFocused}` : ''}`
    case 'tab-item': return `${s.cmsTabItem}${f ? ` ${s.cmsTabItemFocused}` : ''}`
    case 'tab-panel': return s.cmsTabPanel
    // Editorial types
    case 'value-item': return `${s.cmsValueItem}${f ? ` ${s.cmsValueItemFocused}` : ''}`
    case 'quote': return `${s.cmsQuote}${f ? ` ${s.cmsQuoteFocused}` : ''}`
    case 'article': return `${s.cmsArticle}${f ? ` ${s.cmsArticleFocused}` : ''}`
    case 'showcase-item': return `${s.cmsShowcaseItem}${f ? ` ${s.cmsShowcaseItemFocused}` : ''}`
    default: return ''
  }
}

// Section header types — rendered before the grid container
export const HEADER_TYPES = new Set(['section-label', 'section-title', 'section-desc', 'badge', 'text', 'cta'])

export function getChildrenContainerClassName(data: Record<string, string>): string | undefined {
  switch (data.variant) {
    case 'features': return s.cmsFeaturesGrid
    case 'patterns': return s.cmsPatternsGrid
    case 'manifesto': return s.cmsManifestoValues
    case 'showcase': return s.cmsShowcaseGrid
    case 'journal': return s.cmsJournalList
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
  if (data.type === 'tab-group') return 'div'
  if (data.type === 'tab-item') return 'button'
  if (data.type === 'tab-panel') return 'div'
  if (data.type === 'value-item') return 'div'
  if (data.type === 'quote') return 'div'
  if (data.type === 'article') return 'div'
  if (data.type === 'showcase-item') return 'div'
  return 'div'
}

// ── Editable fields — re-export from schema (single source of truth) ──

export { getEditableFields } from './cms-schema'
