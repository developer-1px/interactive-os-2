import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fsPlugin } from './vite-plugin-fs'

export default defineConfig({
  plugins: [react(), fsPlugin()],
})
