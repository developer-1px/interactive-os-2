// ② 2026-03-25-css-writing-rules-prd.md

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // ── margin 금지 — gap으로 간격 관리 ──
    'declaration-property-value-disallowed-list': {
      '/^margin/': ['/.+/'],
    },

    // ── 선언 순서 등 기존 standard 규칙 완화 ──
    'no-descending-specificity': null,
    'selector-class-pattern': null,

    // ── 커스텀 property 패턴 허용 ──
    'custom-property-pattern': null,
  },

  // 기존 코드 점진적 적용 — 초기에는 warning으로
  defaultSeverity: 'warning',

  ignoreFiles: [
    'node_modules/**',
    'dist/**',
  ],
}
