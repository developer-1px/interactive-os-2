import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    ui: 'src/interactive-os/ui/index.ts',
    layout: 'src/interactive-os/layout/index.ts',
    schema: 'src/interactive-os/schema/index.ts',
    advanced: 'src/interactive-os/advanced/index.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: true,
  clean: true,
  outDir: 'dist-lib',
  external: ['react', 'react-dom'],
  treeshake: true,
  tsconfig: 'tsconfig.app.json',
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})
