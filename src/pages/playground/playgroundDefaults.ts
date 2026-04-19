// 초기 코드 — definePage config literal. split + stack + widget 조합 예시.
export const DEFAULT_CODE = `{
  entities: {
    root: {
      data: { type: 'split', direction: 'horizontal', sizes: [0.3, 'flex'] },
      children: ['side', 'main'],
    },
    side: {
      data: { type: 'widget', widget: 'Sidebar', surface: 'raised' },
    },
    main: {
      data: { type: 'stack', gap: 'md', padding: 'md' },
      children: ['header', 'body', 'footer'],
    },
    header: {
      data: { type: 'widget', widget: 'Header', surface: 'raised' },
    },
    body: {
      data: { type: 'widget', widget: 'Body' },
    },
    footer: {
      data: { type: 'widget', widget: 'Footer', surface: 'raised' },
    },
  },
}`
