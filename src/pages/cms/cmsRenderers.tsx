// ② 2026-03-24-cms-editorial-content-prd.md
/* eslint-disable react-refresh/only-export-components */
import { createElement } from 'react'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { localized } from './cmsTypes'
import type { Locale, LocaleMap } from './cmsTypes'
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
        <div className={`flex-row items-center`}>
          <button type="button" className={`inline-flex items-center border-none cursor-pointer`}>
            <LocalizedText value={data.primary as string | LocaleMap} locale={locale} /> <ArrowRight size={16} />
          </button>
          <button type="button" className={`inline-flex items-center cursor-pointer`}>
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
          <div className={`flex-row items-center justify-center shrink-0`}><CmsIcon name={data.icon as string} size={12} /></div>
          <span className={""}><LocalizedText value={data.name as string | LocaleMap} locale={locale} /></span>
        </>
      )
    case 'brand':
      return (
        <>
          <div className="hidden" />
          <span className={""}><LocalizedText value={data.name as string | LocaleMap} locale={locale} /></span>
          <span className={""}>{data.license as string} License</span>
        </>
      )
    case 'badge':
      return <><span className={`inline-block`} /><LocalizedText value={data.value as string | LocaleMap} locale={locale} /></>
    case 'section-label':
    case 'section-title':
    case 'section-desc':
      return <LocalizedText value={data.value as string | LocaleMap} locale={locale} />
    case 'links':
      return null
    case 'link':
      return <a className={`no-underline cursor-pointer`} href={data.href as string}><LocalizedText value={data.label as string | LocaleMap} locale={locale} /></a>
    case 'tab-item':
      return <LocalizedText value={data.label as LocaleMap} locale={locale} />

    // ── Editorial section types ──
    case 'value-item':
      return (
        <div className={`flex-col`}>
          <div className="hidden"><CmsIcon name={data.icon as string} size={24} /></div>
          <h3 className={""}><LocalizedText value={data.title as LocaleMap} locale={locale} /></h3>
          <p className={""}><LocalizedText value={data.desc as LocaleMap} locale={locale} /></p>
        </div>
      )
    case 'quote':
      return (
        <blockquote className={`border-none`}>
          <span className={`block`}>"</span>
          <p className={""}><LocalizedText value={data.text as LocaleMap} locale={locale} /></p>
          <cite className={""}>— <LocalizedText value={data.attribution as LocaleMap} locale={locale} /></cite>
        </blockquote>
      )
    case 'article': {
      const articleImage = data.image as string
      return (
        <div className={`flex-row items-center`}>
          {articleImage
            ? <img src={articleImage} alt="" className={`object-cover shrink-0`} />
            : <div className={`flex-row items-center justify-center shrink-0`}><CmsIcon name={data.icon as string} size={20} /></div>
          }
          <div className={`flex-col`}>
            <h3 className={""}><LocalizedText value={data.title as LocaleMap} locale={locale} /></h3>
            <span className={""}>
              <LocalizedText value={data.category as LocaleMap} locale={locale} /> · {data.readTime as string}
            </span>
          </div>
        </div>
      )
    }
    case 'showcase-item':
      return (
        <div className={`flex-col`}>
          <div className={`inline-flex items-center justify-center`}><CmsIcon name={data.icon as string} size={20} /></div>
          <span className={""}><LocalizedText value={data.label as LocaleMap} locale={locale} /></span>
          <span className={""}><LocalizedText value={data.desc as LocaleMap} locale={locale} /></span>
        </div>
      )
    case 'stat-card':
      return (
        <div className={`flex-col`}>
          <span className={""}>{data.value as string}</span>
          <span className={""}><LocalizedText value={data.label as LocaleMap} locale={locale} /></span>
          <span className={""}><LocalizedText value={data.desc as LocaleMap} locale={locale} /></span>
        </div>
      )
    case 'section-cta':
      return (
        <a className={`inline-flex items-center no-underline cursor-pointer`} href={data.href as string}>
          <LocalizedText value={data.label as LocaleMap} locale={locale} /> <ArrowRight size={14} />
        </a>
      )
    // ── Image blocks ──
    case 'hero-image': {
      const src = data.src as string
      return src
        ? <img src={src} alt={localized(data.alt as string | LocaleMap, locale).text} className={`w-full object-cover`} />
        : <div className={`w-full`} />
    }
    case 'image-card':
      return null
    case 'gallery-item': {
      const gSrc = data.image as string
      return (
        <div className="flex-col">
          {gSrc
            ? <img src={gSrc} alt="" className={`w-full object-cover`} />
            : <div className={`w-full`} />
          }
          <span className={""}><LocalizedText value={data.caption as string | LocaleMap} locale={locale} /></span>
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
    case 'hero':        return `flex-col items-center text-center`
    case 'manifesto':   return ""
    case 'features':    return ""
    case 'patterns':    return ""
    case 'showcase':    return ""
    case 'journal':     return ""
    case 'testimonial': return `flex-row justify-center`
    case 'cta':         return `flex-col items-center text-center`
    case 'footer':      return `flex-row flex-wrap items-baseline`
    case 'gallery':     return ""
    default: return ''
  }
}

export function getNodeClassName(data: Record<string, string>): string {
  switch (data.type) {
    case 'section':
      return getSectionClassName(data.variant)
    case 'stat':         return ""
    case 'card':         return ""
    case 'step':         return ""
    case 'pattern':      return `flex-row items-center`
    case 'step-num':     return ""
    case 'stat-value':   return ""
    case 'text': {
      if (data.role === 'hero-title') return ""
      if (data.role === 'hero-subtitle') return ""
      if (data.role === 'title') return ""
      if (data.role === 'desc') return ""
      if (data.role === 'step-title') return ""
      if (data.role === 'step-desc') return ""
      if (data.role === 'stat-label') return ""
      if (data.role === 'footer-tagline') return ""
      return ''
    }
    case 'section-label': return ""
    case 'section-title': return ""
    case 'section-desc':  return ""
    case 'badge':         return `inline-flex items-center`
    case 'cta':           return ''
    case 'icon':          return `flex-row items-center justify-center`
    case 'brand':         return `flex-row items-baseline`
    case 'links':         return `flex-row`
    case 'link':          return ''
    case 'tab-group':     return ""
    case 'tab-item':      return `border-none cursor-pointer`
    case 'tab-panel':     return ""
    case 'value-item':    return ""
    case 'quote':         return `w-full text-center`
    case 'article':       return ""
    case 'showcase-item': return ""
    case 'stat-card':     return ""
    case 'section-cta':   return `flex-row`
    case 'hero-image':    return `w-full`
    case 'image-card':    return `overflow-hidden`
    case 'gallery-item':  return `overflow-hidden`
    default: return ''
  }
}

// Section header types — rendered before the grid container
export const HEADER_TYPES = new Set(['section-label', 'section-title', 'section-desc', 'badge', 'text', 'cta', 'section-cta'])

export function getChildrenContainerClassName(data: Record<string, string>): string | undefined {
  switch (data.variant) {
    case 'features': return `grid`
    case 'patterns': return `grid`
    case 'manifesto': return `grid`
    case 'showcase': return `grid`
    case 'journal': return `flex-col`
    case 'gallery': return `grid`
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
