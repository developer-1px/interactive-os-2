// ② 2026-03-25-css-writing-rules-prd.md
// ② docs/research/ax/04-gap-plan.md §3.2 (P1-2 Spatial baseline) + §3.4 (P1-4 OKLCH)

/**
 * P1-2 Spatial baseline — padding / margin / gap / inset / top-right-bottom-left / width-height
 *
 * declaration-property-value-allowed-list는 **value 전체 문자열**을 regex로 매칭한다.
 * 따라서 단일 토큰 정규식의 조합(공백·슬래시로 연결)을 하나의 큰 정규식으로 표현한다.
 *
 * 단일 토큰 허용:
 *  - var(--*), calc(...), min(...), max(...), clamp(...)
 *  - keyword: auto | inherit | initial | unset | revert | revert-layer | none | fit-content | max-content | min-content
 *  - 비율 / 컨테이너 단위: N%, Nfr, Nch, Nvw/Nvh 등 (baseline 무관 — 상위 레이아웃 제약)
 *  - px: 0 / 0.5 / 1 / 2 (border 미세 보정) 또는 4의 배수 (4~1280)
 *  - rem: 0, 0.125, 0.25, 0.5, 0.75, 1 … 48 (대략 8px 배수 중심)
 *  - em: 정수 또는 0.25/0.5/0.75 — width/height 외에는 비권장이지만 markdown·icon 미세 조정용
 */

// 단일 토큰 — alternation으로 쪼개서 재사용.
// 중첩 괄호 허용 (1 depth) — var(--x, var(--y)), calc(var(--x) - 8px) 같은 케이스.
const TOKEN_VAR = 'var\\(--[^()]+(\\([^()]*\\)[^()]*)*\\)'
const TOKEN_CALCISH = '(calc|min|max|clamp)\\((?:[^()]|\\([^()]*\\))*\\)'
const TOKEN_KEYWORD = '(auto|inherit|initial|unset|revert|revert-layer|none|fit-content|max-content|min-content)'
const TOKEN_RATIO = '-?\\d+(\\.\\d+)?(%|fr|ch|vw|vh|svh|lvh|dvh|svw|lvw|dvw|vmin|vmax|cqi|cqb|cqw|cqh|cqmin|cqmax)'
// px — 0/0.5/1/2 미세 보정 + 4의 배수 (4 ~ 2048).
// 프로그래매틱 열거: 4n, n=1..512 (2048px까지). 3자리/4자리 모두 커버.
const PX_MULTIPLES = Array.from({ length: 512 }, (_, i) => String((i + 1) * 4)).join('|')
const TOKEN_PX = `(-?0(px)?|-?0\\.5px|-?[12]px|-?(${PX_MULTIPLES})px)`
const TOKEN_REM = '-?(0|0\\.125|0\\.25|0\\.5|0\\.75|1|1\\.25|1\\.5|1\\.75|2|2\\.5|3|3\\.5|4|4\\.5|5|6|7|8|9|10|12|14|16|20|24|32|40|48)rem'
// em — typography 미세 조정용. 0.1~4em 내 2자리 소수 허용.
const TOKEN_EM = '-?([0-4](\\.\\d{1,2})?|5)em'

const SINGLE_TOKEN = `(${TOKEN_VAR}|${TOKEN_CALCISH}|${TOKEN_KEYWORD}|${TOKEN_RATIO}|${TOKEN_PX}|${TOKEN_REM}|${TOKEN_EM})`

// 다중값: single-token ( (space|slash|comma) single-token )*
const SEP = '(\\s+|\\s*/\\s*|\\s*,\\s*)'
const MULTI_VALUE_REGEX = `^${SINGLE_TOKEN}(${SEP}${SINGLE_TOKEN})*$`

/** 적용 속성 */
const SPATIAL_PROPS = [
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-block', 'padding-block-start', 'padding-block-end',
  'padding-inline', 'padding-inline-start', 'padding-inline-end',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-block', 'margin-block-start', 'margin-block-end',
  'margin-inline', 'margin-inline-start', 'margin-inline-end',
  'gap', 'row-gap', 'column-gap', 'grid-gap',
  'top', 'right', 'bottom', 'left',
  'inset', 'inset-block', 'inset-block-start', 'inset-block-end',
  'inset-inline', 'inset-inline-start', 'inset-inline-end',
  'width', 'min-width', 'max-width',
  'height', 'min-height', 'max-height',
]

const SPATIAL_VALUE_REGEX = new RegExp(MULTI_VALUE_REGEX)

/** property별 allowed-list (단일 regex만 등록) */
const buildSpatialAllowedList = () => {
  const out = {}
  for (const prop of SPATIAL_PROPS) out[prop] = [SPATIAL_VALUE_REGEX]
  return out
}

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],

  rules: {
    // ── P1-4 OKLCH 단독 사용 (색상) ──────────────────────────────
    // error: hex 금지. var(--*) 또는 oklch()만.
    'color-no-hex': [true, { severity: 'error' }],
    'color-named': ['never', { severity: 'error', ignore: ['inside-function'] }],

    // hsl/hsla 완전 차단. rgb/rgba는 warn (shadow legacy 잔존, 2026-Q3까지 OKLCH 전환 예정)
    'function-disallowed-list': [
      ['hsl', 'hsla'],
      { severity: 'error' },
    ],

    // ── P1-2 Spatial baseline (4px 배수, 8px 권장) ────────────────
    'declaration-property-value-allowed-list': [
      buildSpatialAllowedList(),
      { severity: 'warning' },
    ],

    // ── margin 금지 — gap으로 간격 관리 ─────────────────────────
    'declaration-property-value-disallowed-list': {
      '/^margin/': ['/.+/'],
    },

    // ── 선언 순서 등 기존 standard 규칙 완화 ────────────────────
    'no-descending-specificity': null,
    'selector-class-pattern': null,
    'custom-property-pattern': null,

    // standard에 포함된 color-function-notation(modern)은 legacy rgba()와 충돌 → 완화
    'color-function-notation': null,
    'alpha-value-notation': null,
    'hue-degree-notation': null,
  },

  overrides: [
    // L0 palette 은 OKLCH primitive 정의 장소 — 원시값 허용
    {
      files: ['src/styles/palette.css'],
      rules: {
        'color-no-hex': null,
        'color-named': null,
        'function-disallowed-list': null,
      },
    },
    // tokens.css / ax.css — shadow rgba(0,0,0,…) legacy 허용 (2026-Q3 OKLCH 전환 예정)
    {
      files: ['src/styles/tokens.css', 'src/styles/ax.css'],
      rules: {
        'color-no-hex': null, // linear-gradient(#fff 0 0) 마스크 트릭 유지용
        'function-disallowed-list': null,
      },
    },
    // landingTokens.css — Landing 전용 레거시 hex 팔레트. 별도 마이그레이션 예정.
    {
      files: ['src/styles/landingTokens.css'],
      rules: {
        'color-no-hex': null,
        'function-disallowed-list': null,
      },
    },
    // spatial 규칙은 컴포넌트 CSS만 — token/ax/layout 기반 파일은 자유값 사용
    {
      files: [
        'src/styles/palette.css',
        'src/styles/tokens.css',
        'src/styles/ax.css',
        'src/styles/axes.css',
        'src/styles/landingTokens.css',
        'src/styles/layers.css',
        'src/styles/layout.css',
        'src/styles/reset.css',
      ],
      rules: {
        'declaration-property-value-allowed-list': null,
      },
    },
  ],

  // 기존 코드 점진 적용 — 미지정은 warning
  defaultSeverity: 'warning',

  ignoreFiles: [
    'node_modules/**',
    'dist/**',
    'dist-lib/**',
    '.claude/**',
    '.worktrees/**',
  ],
}
