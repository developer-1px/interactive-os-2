import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'

export const i18nColumns = [
  { key: 'key', header: 'Key' },
  { key: 'ko', header: 'ko' },
  { key: 'en', header: 'en' },
  { key: 'ja', header: 'ja' },
]

export const i18nInitialData = createStore({
  entities: {
    'hero-title':    { id: 'hero-title',    data: { cells: ['hero.title',    '헤드리스 ARIA 엔진',       'Headless ARIA Engine',       ''] } },
    'hero-subtitle': { id: 'hero-subtitle', data: { cells: ['hero.subtitle', '모든 ARIA role을 지원하는', 'Build fully accessible apps', ''] } },
    'nav-home':      { id: 'nav-home',      data: { cells: ['nav.home',      '홈',                        'Home',                        'ホーム'] } },
    'nav-about':     { id: 'nav-about',     data: { cells: ['nav.about',     '소개',                      'About',                       '紹介'] } },
    'nav-contact':   { id: 'nav-contact',   data: { cells: ['nav.contact',   '문의',                      'Contact',                     ''] } },
    'stat-patterns': { id: 'stat-patterns', data: { cells: ['stat.patterns', '14',                       '14',                          '14'] } },
    'stat-plugins':  { id: 'stat-plugins',  data: { cells: ['stat.plugins',  '10',                       '10',                          '10'] } },
    'cta-start':     { id: 'cta-start',     data: { cells: ['cta.start',     '시작하기',                  'Get Started',                 ''] } },
    'cta-docs':      { id: 'cta-docs',      data: { cells: ['cta.docs',      '문서 보기',                 'View Docs',                   'ドキュメント'] } },
    'footer-copy':   { id: 'footer-copy',   data: { cells: ['footer.copy',   '© 2026 interactive-os',    '© 2026 interactive-os',       '© 2026 interactive-os'] } },
  },
  relationships: {
    [ROOT_ID]: [
      'hero-title', 'hero-subtitle',
      'nav-home', 'nav-about', 'nav-contact',
      'stat-patterns', 'stat-plugins',
      'cta-start', 'cta-docs',
      'footer-copy',
    ],
  },
})
