import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fsPlugin } from './vite-plugin-fs'
import { agentOpsPlugin } from './vite-plugin-agent-ops'
import { inspectorPlugin } from './vite-plugin-inspector'
import { browserTestPlugin } from './src/testRunner/browserTestPlugin'

export default defineConfig({
  plugins: [
    react(),
    inspectorPlugin(),
    fsPlugin(),
    agentOpsPlugin(),
    browserTestPlugin(),
  ],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
})
