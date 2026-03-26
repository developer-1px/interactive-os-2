/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: '순환 의존 금지 (type-only 순환은 허용)',
      from: { path: '^src/interactive-os/' },
      to: { circular: true, dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'no-layer-violation',
      severity: 'error',
      comment: '하위 레이어가 상위 레이어를 import할 수 없다',
      from: { path: '^src/interactive-os/store/' },
      to: { path: '^src/interactive-os/(engine|axis|pattern|plugins|misc|primitives|ui)/' },
    },
    {
      name: 'no-layer-violation',
      severity: 'error',
      from: { path: '^src/interactive-os/engine/' },
      to: { path: '^src/interactive-os/(pattern|plugins|misc|primitives|ui)/' },
    },
    {
      name: 'no-layer-violation',
      severity: 'error',
      from: { path: '^src/interactive-os/axis/' },
      to: { path: '^src/interactive-os/(pattern|plugins|misc|primitives|ui)/' },
    },
    {
      name: 'no-layer-violation',
      severity: 'error',
      from: { path: '^src/interactive-os/pattern/' },
      to: { path: '^src/interactive-os/(plugins|misc|primitives|ui)/' },
    },
    {
      name: 'no-layer-violation',
      severity: 'error',
      from: { path: '^src/interactive-os/plugins/' },
      to: { path: '^src/interactive-os/(primitives|ui)/' },
    },
    {
      name: 'no-layer-violation',
      severity: 'error',
      from: { path: '^src/interactive-os/misc/' },
      to: { path: '^src/interactive-os/(primitives|ui)/' },
    },
    {
      name: 'no-layer-violation',
      severity: 'error',
      from: { path: '^src/interactive-os/primitives/' },
      to: { path: '^src/interactive-os/ui/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
    exclude: {
      path: '(__tests__|__mocks__|\\.(test|spec)\\.(ts|tsx)$)',
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
}
