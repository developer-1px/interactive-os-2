import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: [
    'src/main.tsx',
    'scripts/*.{ts,mjs}',
    '.claude/hooks/*.mjs',
    'viewer-channel.mjs',
  ],
  project: ['src/**/*.{ts,tsx}'],
  ignore: ['src/externals.d.ts'],
}

export default config
