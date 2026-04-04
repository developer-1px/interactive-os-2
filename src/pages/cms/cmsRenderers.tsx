// ② 2026-03-24-cms-editorial-content-prd.md
/* eslint-disable react-refresh/only-export-components */
import { createElement } from 'react'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { localized } from './cmsTypes'
import type { Locale, LocaleMap } from './cmsTypes'
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
        <div className={`${s.cmsHeroActions} flex-row items-center`}>
          <button type="button" className={`${s.cmsHeroCta} inline-flex items-center border-none cursor-pointer`}>
            <LocalizedText value={data.primary as string | LocaleMap} locale={locale} /> <ArrowRight size={16} />
          </button>
          <button type="button" className={`${s.cmsHeroCtaSecondary} inline-flex items-center cursor-pointer`}>
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
          <div className={`${s.cmsPatternIcon} flex-row items-center justify-center shrink-0`}><CmsIcon name={data.icon as string} size={12} /></div>
          <span className={s.cmsPatternName}><LocalizedText value={data.name as string | LocaleMap} locale={locale} /></span>
        </>
      )
    case 'brand':
      return (
        <>
          <div className="hidden" />
          <span className={s.cmsFooterName}><LocalizedText value={data.name as string | LocaleMap} locale={locale} /></span>
          <span className={s.cmsFooterCopy}>{data.license as string} License</span>
        </>
      )
    case 'badge':
      return <><span className={`${s.cmsHeroBadgeDot} inline-block`} /><LocalizedText value={data.value as string | LocaleMap} locale={locale} /></>
    case 'section-label':
    case 'section-title':
    case 'section-desc':
      return <LocalizedText value={data.value as string | LocaleMap} locale={locale} />
    case 'links':
      return null
    case 'link':
      return <a className={`${s.cmsFooterLink} no-underline cursor-pointer`} href={data.href as string}><LocalizedText value={data.label as string | LocaleMap} locale={locale} /></a>
    case 'tab-item':
      return <LocalizedText value={data.label as LocaleMap} locale={locale} />

    // ── Editorial section types ──
    case 'value-item':
      return (
        <div className={`${s.cmsValueItemContent} flex-col`}>
          <div className="hidden"><CmsIcon name={data.icon as string} size={24} /></div>
          <h3 className={s.cmsValueItemTitle}><LocalizedText value={data.title as LocaleMap} locale={locale} /></h3>
          <p className={s.cmsValueItemDesc}><LocalizedText value={data.desc as LocaleMap} locale={locale} /></p>
        </div>
      )
    case 'quote':
      return (
        <blockquote className={`${s.cmsQuoteContent} border-none`}>
          <span className={`${s.cmsQuoteMark} block`}>"</span>
          <p className={s.cmsQuoteText}><LocalizedText value={data.text as LocaleMap} locale={locale} /></p>
          <cite className={s.cmsQuoteAttribution}>— <LocalizedText value={data.attribution as LocaleMap} locale={locale} /></cite>
        </blockquote>
      )
    case 'article': {
      const articleImage = data.image as string
      return (
        <div className={`${s.cmsArticleContent} flex-row items-center`}>
          {articleImage
            ? <img src={articleImage} alt="" className={`${s.cmsArticleImage} object-cover shrink-0`} />
            : <div className={`${s.cmsArticleIcon} flex-row items-center justify-center shrink-0`}><CmsIcon name={data.icon as string} size={20} /></div>
          }
          <div className={`${s.cmsArticleBody} flex-col`}>
            <h3 className={s.cmsArticleTitle}><LocalizedText value={data.title as LocaleMap} locale={locale} /></h3>
            <span className={s.cmsArticleMeta}>
              <LocalizedText value={data.category as LocaleMap} locale={locale} /> · {data.readTime as string}
            </span>
          </div>
        </div>
      )
    }
    case 'showcase-item':
      return (
        <div className={`${s.cmsShowcaseItemContent} flex-col`}>
          <div className={`${s.cmsShowcaseItemIcon} inline-flex items-center justify-center`}><CmsIcon name={data.icon as string} size={20} /></div>
          <span className={s.cmsShowcaseItemLabel}><LocalizedText value={data.label as LocaleMap} locale={locale} /></span>
          <span className={s.cmsShowcaseItemDesc}><LocalizedText value={data.desc as LocaleMap} locale={locale} /></span>
        </div>
      )
    case 'stat-card':
      return (
        <div className={`${s.cmsStatCardContent} flex-col`}>
          <span className={s.cmsStatCardValue}>{data.value as string}</span>
          <span className={s.cmsStatCardLabel}><LocalizedText value={data.label as LocaleMap} locale={locale} /></span>
          <span className={s.cmsStatCardDesc}><LocalizedText value={data.desc as LocaleMap} locale={locale} /></span>
        </div>
      )
    case 'section-cta':
      return (
        <a className={`${s.cmsSectionCtaLink} inline-flex items-center no-underline cursor-pointer`} href={data.href as string}>
          <LocalizedText value={data.label as LocaleMap} locale={locale} /> <ArrowRight size={14} />
        </a>
      )
    // ── Image blocks ──
    case 'hero-image': {
      const src = data.src as string
      return src
        ? <img src={src} alt={localized(data.alt as string | LocaleMap, locale).text} className={`${s.cmsHeroImage} w-full object-cover`} />
        : <div className={`${s.cmsHeroImagePlaceholder} w-full`} />
    }
    case 'image-card':
      return null
    case 'gallery-item': {
      const gSrc = data.image as string
      return (
        <div className="flex-col">
          {gSrc
            ? <img src={gSrc} alt="" className={`${s.cmsGalleryItemImage} w-full object-cover`} />
            : <div className={`${s.cmsGalleryItemPlaceholder} w-full`} />
          }
          <span className={s.cmsGalleryItemCaption}><LocalizedText value={data.caption as string | LocaleMap} locale={locale} /></span>
        </div>
      )
    }
    default:
      return null
  }
}


// ── CSS class mapping ──

export function getSectionClassName(variant: string): string {
  switch (variant) {
    case 'hero':        return `${s.cmsHero} flex-col items-center text-center`
    case 'manifesto':   return s.cmsManifesto
    case 'features':    return s.cmsFeatures
    case 'patterns':    return s.cmsPatterns
    case 'showcase':    return s.cmsShowcase
    case 'journal':     return s.cmsJournal
    case 'testimonial': return `${s.cmsTestimonial} flex-row justify-center`
    case 'cta':         return `${s.cmsCta} flex-col items-center text-center`
    case 'footer':      return `${s.cmsFooter} flex-row flex-wrap items-baseline`
    case 'gallery':     return s.cmsGallery
    default: return ''
  }
}

export function getNodeClassName(data: Record<string, string>): string {
  switch (data.type) {
    case 'section':
      return getSectionClassName(data.variant)
    case 'stat':         return s.cmsStat
    case 'card':         return s.cmsFeatureCard
    case 'step':         return s.cmsStep
    case 'pattern':      return `${s.cmsPattern} flex-row items-center`
    case 'step-num':     return s.cmsStepNumber
    case 'stat-value':   return s.cmsStatValue
    case 'text': {
      if (data.role === 'hero-title') return s.cmsHeroTitle
      if (data.role === 'hero-subtitle') return s.cmsHeroSubtitle
      if (data.role === 'title') return s.cmsFeatureCardTitle
      if (data.role === 'desc') return s.cmsFeatureCardDesc
      if (data.role === 'step-title') return s.cmsStepTitle
      if (data.role === 'step-desc') return s.cmsStepDesc
      if (data.role === 'stat-label') return s.cmsStatLabel
      if (data.role === 'footer-tagline') return s.cmsFooterTagline
      return ''
    }
    case 'section-label': return s.cmsSectionLabel
    case 'section-title': return s.cmsSectionTitle
    case 'section-desc':  return s.cmsSectionDesc
    case 'badge':         return `${s.cmsHeroBadge} inline-flex items-center`
    case 'cta':           return ''
    case 'icon':          return `${s.cmsFeatureCardIcon} flex-row items-center justify-center`
    case 'brand':         return `${s.cmsFooterBrand} flex-row items-baseline`
    case 'links':         return `${s.cmsFooterLinks} flex-row`
    case 'link':          return ''
    case 'tab-group':     return s.cmsTabGroup
    case 'tab-item':      return `${s.cmsTabItem} border-none cursor-pointer`
    case 'tab-panel':     return s.cmsTabPanel
    case 'value-item':    return s.cmsValueItem
    case 'quote':         return `${s.cmsQuote} w-full text-center`
    case 'article':       return s.cmsArticle
    case 'showcase-item': return s.cmsShowcaseItem
    case 'stat-card':     return s.cmsStatCard
    case 'section-cta':   return `${s.cmsSectionCta} flex-row`
    case 'hero-image':    return `${s.cmsHeroImageWrap} w-full`
    case 'image-card':    return `${s.cmsImageCard} overflow-hidden`
    case 'gallery-item':  return `${s.cmsGalleryItem} overflow-hidden`
    default: return ''
  }
}

// Section header types — rendered before the grid container
export const HEADER_TYPES = new Set(['section-label', 'section-title', 'section-desc', 'badge', 'text', 'cta', 'section-cta'])

export function getChildrenContainerClassName(data: Record<string, string>): string | undefined {
  switch (data.variant) {
    case 'features': return `${s.cmsFeaturesGrid} grid`
    case 'patterns': return `${s.cmsPatternsGrid} grid`
    case 'manifesto': return `${s.cmsManifestoValues} grid`
    case 'showcase': return `${s.cmsShowcaseGrid} grid`
    case 'journal': return `${s.cmsJournalList} flex-col`
    case 'gallery': return `${s.cmsGalleryGrid} grid`
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
  if (data.type === 'stat-card') return 'div'
  if (data.type === 'section-cta') return 'div'
  return 'div'
}

// ── Editable fields — re-export from schema (single source of truth) ──

export { getEditableFields, getInlineEditableFields } from './cmsSchema'
