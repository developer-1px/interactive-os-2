// ② 2026-03-24-cms-editorial-content-prd.md
/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { localized } from './cmsTypes'
import type { Locale, LocaleMap } from './cmsTypes'
import s from './CmsLanding.module.css'
import { CMS_ICON_MAP } from './cmsIcons'

// ── Shared helpers ──

function LocalizedText({ value, locale }: { value: string | LocaleMap; locale: Locale }) {
  const { text, isFallback } = localized(value, locale)
  return <span className={isFallback ? 'cms-text--fallback' : undefined}>{text}</span>
}

export function CmsIcon({ name, size }: { name: string; size: number }) {
  const Icon = CMS_ICON_MAP.get(name)
  if (!Icon) return null
  return createElement(Icon, { size })
}

// ── Types ──

type NodeTag = keyof React.JSX.IntrinsicElements

export interface NodePresentationDesc {
  tag?: NodeTag | ((data: Record<string, string>) => NodeTag)
  className?: string | ((data: Record<string, string>) => string)
  childrenContainerClassName?: string | ((data: Record<string, string>) => string | undefined)
  render?: (data: Record<string, unknown>, locale: Locale) => ReactNode
}

// ── Registry ──

export const nodeRegistry = new Map<string, NodePresentationDesc>()

export function defineNodePresentation(type: string, desc: NodePresentationDesc) {
  nodeRegistry.set(type, desc)
}

// ── Section presentation (variant → className/children 조회) ──

const sectionVariantClass: Record<string, string> = {
  hero: `${s.cmsHero} flex-col items-center text-center`,
  manifesto: s.cmsManifesto,
  features: s.cmsFeatures,
  patterns: s.cmsPatterns,
  showcase: s.cmsShowcase,
  journal: s.cmsJournal,
  testimonial: `${s.cmsTestimonial} flex-row justify-center`,
  cta: `${s.cmsCta} flex-col items-center text-center`,
  footer: `${s.cmsFooter} flex-row flex-wrap items-baseline`,
  gallery: s.cmsGallery,
}

const sectionChildrenClass: Record<string, string> = {
  features: `${s.cmsFeaturesGrid} grid`,
  patterns: `${s.cmsPatternsGrid} grid`,
  manifesto: `${s.cmsManifestoValues} grid`,
  showcase: `${s.cmsShowcaseGrid} grid`,
  journal: `${s.cmsJournalList} flex-col`,
  gallery: `${s.cmsGalleryGrid} grid`,
}

defineNodePresentation('section', {
  tag: (data) => data.variant === 'footer' ? 'footer' : 'section',
  className: (data) => sectionVariantClass[data.variant] ?? '',
  childrenContainerClassName: (data) => sectionChildrenClass[data.variant],
})

// ── Text role → tag/className ──

const textRoleTag: Record<string, NodeTag> = {
  'hero-title': 'h1', 'hero-subtitle': 'p',
  'title': 'h3', 'desc': 'p',
  'step-title': 'h3', 'step-desc': 'p',
}

const textRoleClass: Record<string, string> = {
  'hero-title': s.cmsHeroTitle, 'hero-subtitle': s.cmsHeroSubtitle,
  'title': s.cmsFeatureCardTitle, 'desc': s.cmsFeatureCardDesc,
  'step-title': s.cmsStepTitle, 'step-desc': s.cmsStepDesc,
  'stat-label': s.cmsStatLabel, 'footer-tagline': s.cmsFooterTagline,
}

defineNodePresentation('text', {
  tag: (data) => textRoleTag[data.role] ?? 'span',
  className: (data) => textRoleClass[data.role] ?? '',
  render: (data, locale) => <LocalizedText value={data.value as string | LocaleMap} locale={locale} />,
})

defineNodePresentation('cta', {
  className: '',
  render: (data, locale) => (
    <div className={`${s.cmsHeroActions} flex-row items-center`}>
      <button type="button" className={`${s.cmsHeroCta} inline-flex items-center border-none cursor-pointer`}>
        <LocalizedText value={data.primary as string | LocaleMap} locale={locale} /> <ArrowRight size={16} />
      </button>
      <button type="button" className={`${s.cmsHeroCtaSecondary} inline-flex items-center cursor-pointer`}>
        <LocalizedText value={data.secondary as string | LocaleMap} locale={locale} /> <ChevronRight size={16} />
      </button>
    </div>
  ),
})

defineNodePresentation('stat', {
  tag: 'div',
  className: s.cmsStat,
  render: () => null,
})

defineNodePresentation('stat-value', {
  tag: 'span',
  className: s.cmsStatValue,
  render: (data) => data.value as string,
})

defineNodePresentation('icon', {
  className: `${s.cmsFeatureCardIcon} flex-row items-center justify-center`,
  render: (data) => <CmsIcon name={data.value as string} size={16} />,
})

defineNodePresentation('step', {
  tag: 'div',
  className: s.cmsStep,
  render: () => null,
})

defineNodePresentation('step-num', {
  tag: 'span',
  className: s.cmsStepNumber,
  render: (data) => data.value as string,
})

defineNodePresentation('pattern', {
  className: `${s.cmsPattern} flex-row items-center`,
  render: (data, locale) => (
    <div className="contents">
      <div className={`${s.cmsPatternIcon} flex-row items-center justify-center shrink-0`}><CmsIcon name={data.icon as string} size={12} /></div>
      <span className={s.cmsPatternName}><LocalizedText value={data.name as string | LocaleMap} locale={locale} /></span>
    </div>
  ),
})

defineNodePresentation('brand', {
  className: `${s.cmsFooterBrand} flex-row items-baseline`,
  render: (data, locale) => (
    <div className="contents">
      <div className="hidden" />
      <span className={s.cmsFooterName}><LocalizedText value={data.name as string | LocaleMap} locale={locale} /></span>
      <span className={s.cmsFooterCopy}>{data.license as string} License</span>
    </div>
  ),
})

defineNodePresentation('badge', {
  className: `${s.cmsHeroBadge} inline-flex items-center`,
  render: (data, locale) => <div className="contents"><span className={`${s.cmsHeroBadgeDot} inline-block`} /><LocalizedText value={data.value as string | LocaleMap} locale={locale} /></div>,
})

defineNodePresentation('section-label', {
  tag: 'p',
  className: s.cmsSectionLabel,
  render: (data, locale) => <LocalizedText value={data.value as string | LocaleMap} locale={locale} />,
})

defineNodePresentation('section-title', {
  tag: 'h2',
  className: s.cmsSectionTitle,
  render: (data, locale) => <LocalizedText value={data.value as string | LocaleMap} locale={locale} />,
})

defineNodePresentation('section-desc', {
  tag: 'p',
  className: s.cmsSectionDesc,
  render: (data, locale) => <LocalizedText value={data.value as string | LocaleMap} locale={locale} />,
})

defineNodePresentation('links', {
  tag: 'nav',
  className: `${s.cmsFooterLinks} flex-row`,
  render: () => null,
})

defineNodePresentation('link', {
  className: '',
  render: (data, locale) => <a className={`${s.cmsFooterLink} no-underline cursor-pointer`} href={data.href as string}><LocalizedText value={data.label as string | LocaleMap} locale={locale} /></a>,
})

defineNodePresentation('tab-group', {
  tag: 'div',
  className: s.cmsTabGroup,
})

defineNodePresentation('tab-item', {
  tag: 'button',
  className: `${s.cmsTabItem} border-none cursor-pointer`,
  render: (data, locale) => <LocalizedText value={data.label as LocaleMap} locale={locale} />,
})

defineNodePresentation('tab-panel', {
  tag: 'div',
  className: s.cmsTabPanel,
})

defineNodePresentation('card', {
  className: s.cmsFeatureCard,
})

defineNodePresentation('value-item', {
  tag: 'div',
  className: s.cmsValueItem,
  render: (data, locale) => (
    <div className={`${s.cmsValueItemContent} flex-col`}>
      <div className="hidden"><CmsIcon name={data.icon as string} size={24} /></div>
      <h3 className={s.cmsValueItemTitle}><LocalizedText value={data.title as LocaleMap} locale={locale} /></h3>
      <p className={s.cmsValueItemDesc}><LocalizedText value={data.desc as LocaleMap} locale={locale} /></p>
    </div>
  ),
})

defineNodePresentation('quote', {
  tag: 'div',
  className: `${s.cmsQuote} w-full text-center`,
  render: (data, locale) => (
    <blockquote className={`${s.cmsQuoteContent} border-none`}>
      <span className={`${s.cmsQuoteMark} block`}>"</span>
      <p className={s.cmsQuoteText}><LocalizedText value={data.text as LocaleMap} locale={locale} /></p>
      <cite className={s.cmsQuoteAttribution}>— <LocalizedText value={data.attribution as LocaleMap} locale={locale} /></cite>
    </blockquote>
  ),
})

defineNodePresentation('article', {
  tag: 'div',
  className: s.cmsArticle,
  render: (data, locale) => {
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
  },
})

defineNodePresentation('showcase-item', {
  tag: 'div',
  className: s.cmsShowcaseItem,
  render: (data, locale) => (
    <div className={`${s.cmsShowcaseItemContent} flex-col`}>
      <div className={`${s.cmsShowcaseItemIcon} inline-flex items-center justify-center`}><CmsIcon name={data.icon as string} size={20} /></div>
      <span className={s.cmsShowcaseItemLabel}><LocalizedText value={data.label as LocaleMap} locale={locale} /></span>
      <span className={s.cmsShowcaseItemDesc}><LocalizedText value={data.desc as LocaleMap} locale={locale} /></span>
    </div>
  ),
})

defineNodePresentation('stat-card', {
  tag: 'div',
  className: s.cmsStatCard,
  render: (data, locale) => (
    <div className={`${s.cmsStatCardContent} flex-col`}>
      <span className={s.cmsStatCardValue}>{data.value as string}</span>
      <span className={s.cmsStatCardLabel}><LocalizedText value={data.label as LocaleMap} locale={locale} /></span>
      <span className={s.cmsStatCardDesc}><LocalizedText value={data.desc as LocaleMap} locale={locale} /></span>
    </div>
  ),
})

defineNodePresentation('section-cta', {
  tag: 'div',
  className: `${s.cmsSectionCta} flex-row`,
  render: (data, locale) => (
    <a className={`${s.cmsSectionCtaLink} inline-flex items-center no-underline cursor-pointer`} href={data.href as string}>
      <LocalizedText value={data.label as LocaleMap} locale={locale} /> <ArrowRight size={14} />
    </a>
  ),
})

defineNodePresentation('hero-image', {
  className: `${s.cmsHeroImageWrap} w-full`,
  render: (data, locale) => {
    const src = data.src as string
    return src
      ? <img src={src} alt={localized(data.alt as string | LocaleMap, locale).text} className={`${s.cmsHeroImage} w-full object-cover`} />
      : <div className={`${s.cmsHeroImagePlaceholder} w-full`} />
  },
})

defineNodePresentation('image-card', {
  className: `${s.cmsImageCard} overflow-hidden`,
  render: () => null,
})

defineNodePresentation('gallery-item', {
  className: `${s.cmsGalleryItem} overflow-hidden`,
  render: (data, locale) => {
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
  },
})

