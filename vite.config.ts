import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import { fsPlugin } from './vite-plugin-fs'
import { agentOpsPlugin } from './vite-plugin-agent-ops'
import { inspectorPlugin } from './vite-plugin-inspector'
import { browserTestPlugin } from './src/devtools/testRunner/browserTestPlugin'
import writerPlugin from './writerFilePlugin'

export default defineConfig({
  plugins: [
    react(),
    inspectorPlugin(),
    fsPlugin(),
    agentOpsPlugin(),
    browserTestPlugin(),
    writerPlugin(),
  ],
  resolve: {
    alias: {
      '@os': path.resolve(__dirname, 'src/interactive-os'),
      '@styles': path.resolve(__dirname, 'src/styles'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
})
