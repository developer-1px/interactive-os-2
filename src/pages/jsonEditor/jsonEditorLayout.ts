import { defineLayout } from '@os/layout'

export const jsonEditorLayout = defineLayout({
  entities: {
    root: {
      data: { type: 'split', direction: 'horizontal', sizes: ['flex', 0.4] },
      children: ['editor', 'output'],
    },
    editor: { data: { type: 'widget', widget: 'JsonEditorWidget' } },
    output: {
      data: { type: 'tabgroup', activeTabId: 'tab-json' },
      children: ['tab-json', 'tab-zod', 'tab-ts'],
    },
    'tab-json': {
      data: { type: 'tab', label: 'JSON', contentType: 'json' },
      children: ['json-panel'],
    },
    'tab-zod': {
      data: { type: 'tab', label: 'Zod', contentType: 'zod' },
      children: ['zod-panel'],
    },
    'tab-ts': {
      data: { type: 'tab', label: 'TypeScript', contentType: 'ts' },
      children: ['ts-panel'],
    },
    'json-panel': { data: { type: 'widget', widget: 'JsonOutputWidget' } },
    'zod-panel': { data: { type: 'widget', widget: 'ZodOutputWidget' } },
    'ts-panel': { data: { type: 'widget', widget: 'TsOutputWidget' } },
  },
})
