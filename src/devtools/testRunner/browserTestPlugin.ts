import type { Plugin } from 'vite'

export function browserTestPlugin(): Plugin {
  return {
    name: 'browser-test',

    resolveId(source, importer) {
      if (importer?.includes('?browser') && source.includes('?browser')) {
        return source.replace('?browser', '')
      }
      return null
    },

    transform(code, id) {
      if (!id.includes('?browser')) return null

      const transformed = code
        .replace(
          /from\s+(["'])vitest\1/g,
          "from '/src/devtools/testRunner/vitestShim'",
        )
        .replace(
          /from\s+(["'])@testing-library\/react\1/g,
          "from '/src/devtools/testRunner/rtlShim'",
        )

      return transformed !== code ? { code: transformed, map: null } : null
    },
  }
}
