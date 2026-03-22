import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import { fsPlugin } from './vite-plugin-fs'
import { agentOpsPlugin } from './vite-plugin-agent-ops'

export default defineConfig({
  plugins: [
    mdx({ remarkPlugins: [remarkGfm] }),
    react(),
    fsPlugin(),
    agentOpsPlugin(),
  ],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
})
