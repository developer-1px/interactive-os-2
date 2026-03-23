import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import { fsPlugin } from './vite-plugin-fs'
import { agentOpsPlugin } from './vite-plugin-agent-ops'
import { inspectorPlugin } from './vite-plugin-inspector'
import babelInspector from './vite-plugins/babelInspector'

export default defineConfig({
  plugins: [
    mdx({ remarkPlugins: [remarkGfm], include: /\.mdx$/ }),
    react({ babel: { plugins: [babelInspector] } }),
    fsPlugin(),
    agentOpsPlugin(),
    inspectorPlugin(),
  ],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
})
