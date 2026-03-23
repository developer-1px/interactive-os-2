import type { Plugin } from 'vite'

export function inspectorPlugin(): Plugin {
  return {
    name: 'vite-plugin-component-inspector',
    apply: 'serve',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'module', src: '/vite-plugins/component-inspector/ui/client.tsx' },
          injectTo: 'body',
        },
      ]
    },
  }
}
